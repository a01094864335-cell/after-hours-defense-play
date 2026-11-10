"""Auditable independent repetitions of every browser regression (not screenshots).

Run one CI shard: FEATURE_QA_SHARD=0 python tests/run_feature_qa.py
The five shards cover attempts 1..10. No automatic retry masks failed attempts.
"""
import importlib
import json
import os
from pathlib import Path
import sys
import time
import unittest
from playwright.sync_api import Browser

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('FEATURE_QA_DIR', '/tmp/feature-qa'))
SHARD = int(os.environ.get('FEATURE_QA_SHARD', '0'))
if SHARD not in range(5):
    raise ValueError('FEATURE_QA_SHARD must be 0..4')
OUT.mkdir(parents=True, exist_ok=True)

# Modal inventory is already independently captured in the existing release job.
# Avoid its hundreds of screenshots counting as functional repetitions.
modules = sorted(p.stem for p in (ROOT/'tests').glob('test_*.py') if p.stem != 'test_modal_inventory')
classes = []
for name in modules:
    module = importlib.import_module(name)
    classes.extend(cls for cls in vars(module).values() if isinstance(cls, type)
                   and issubclass(cls, unittest.TestCase) and cls.__module__ == name)
ids = sorted({f'{cls.__module__}.{cls.__name__}.{method}' for cls in classes
              for method in unittest.defaultTestLoader.getTestCaseNames(cls)})
report = {'sourceCommit': os.environ.get('GITHUB_SHA', 'local-uncommitted'),
          'shard': SHARD, 'engine': 'chromium', 'attemptsPerScenarioTarget': 10,
          'isolation': 'Each test uses new browser contexts; no live user storage. Scenario-controlled fixtures are documented in test source.',
          'seed': None, 'seedPolicy': 'Existing browser scenarios use their documented deterministic fixtures; no global RNG override.',
          'retryPolicy': 'No retries. Every failure remains in this report.',
          'scenarioCount': len(ids), 'inventory': ids, 'attempts': []}


active_entry = None
original_new_context = Browser.new_context
def audited_new_context(browser, *args, **kwargs):
    context = original_new_context(browser, *args, **kwargs)
    if active_entry is not None:
        active_entry.setdefault('contexts', []).append({
            'viewport': kwargs.get('viewport'),
            'touch': kwargs.get('has_touch', False),
            'mobile': kwargs.get('is_mobile', False)})
    return context
Browser.new_context = audited_new_context

def save():
    (OUT/'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))


class Result(unittest.TextTestResult):
    def startTest(self, test):
        global active_entry
        super().startTest(test)
        self.started = time.monotonic()
        self.entry = {'scenario': test.id(), 'attempt': self.attempt,
                      'status': 'running', 'failures': [], 'screenshots': []}
        active_entry = self.entry
        report['attempts'].append(self.entry)
        save()

    def capture(self, test):
        browser = getattr(test, 'browser', None)
        if not browser:
            return
        for ci, context in enumerate(browser.contexts):
            for pi, page in enumerate(context.pages):
                try:
                    name = f'{test.id()}-{self.attempt}-{ci}-{pi}.png'
                    page.screenshot(path=str(OUT/name), full_page=True, timeout=5000)
                    self.entry['screenshots'].append(name)
                    self.entry.setdefault('viewports', []).append(page.viewport_size)
                except Exception as error:
                    self.entry.setdefault('captureErrors', []).append(str(error))

    def addSuccess(self, test):
        super().addSuccess(test)
        self.entry['status'] = 'passed'

    def addFailure(self, test, err):
        super().addFailure(test, err)
        self.entry['status'] = 'failed'
        self.entry['failures'].append(self._exc_info_to_string(err, test))
        self.capture(test)

    def addError(self, test, err):
        super().addError(test, err)
        if test.id() not in ids:
            report.setdefault('fixtureErrors', []).append({'attempt': self.attempt, 'fixture': test.id(), 'error': self._exc_info_to_string(err, test)})
            save()
            return
        self.entry['status'] = 'error'
        self.entry['failures'].append(self._exc_info_to_string(err, test))
        self.capture(test)

    def addSubTest(self, test, subtest, err):
        super().addSubTest(test, subtest, err)
        if err:
            self.entry['status'] = 'failed'
            self.entry['failures'].append(self._exc_info_to_string(err, test))
            self.capture(test)

    def addSkip(self, test, reason):
        super().addSkip(test, reason)
        self.entry.update(status='skipped', reason=reason)

    def stopTest(self, test):
        global active_entry
        active_entry = None
        self.entry['seconds'] = round(time.monotonic()-self.started, 3)
        save()
        super().stopTest(test)

ok = True
for attempt in range(SHARD*2+1, SHARD*2+3):
    Result.attempt = attempt
    suite = unittest.TestSuite(unittest.defaultTestLoader.loadTestsFromTestCase(cls) for cls in classes)
    result = unittest.TextTestRunner(verbosity=2, resultclass=Result).run(suite)
    ok = result.wasSuccessful() and ok
    seen = {e['scenario'] for e in report['attempts'] if e['attempt'] == attempt}
    for scenario in ids:
        if scenario not in seen:
            report['attempts'].append({'scenario': scenario, 'attempt': attempt, 'status': 'not-run'})
    save()
report['counts'] = {state: sum(a['status'] == state for a in report['attempts'])
                    for state in ['passed', 'failed', 'error', 'skipped', 'not-run', 'running']}
save()
sys.exit(0 if ok and report['counts']['passed'] == len(ids)*2 else 1)
