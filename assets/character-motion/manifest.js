'use strict';
// Full-body motion sheets derived from the current menu faces.
Object.assign(MotionSheets, {
  "gobi": {
    "name": "고비",
    "group": "staff",
    "artStyle": "main-comic",
    "file": "assets/character-motion/gobi.webp",
    "fallback": "assets/character-motion/gobi-idle.webp",
    "faceReference": "assets/character-portraits/gobi.webp",
    "width": 1536,
    "sheetHeight": 1024,
    "height": 472,
    "frames": [
      {
        "x": 97,
        "y": 17,
        "w": 312,
        "h": 472,
        "pivotX": 159,
        "pivotY": 471
      },
      {
        "x": 609,
        "y": 17,
        "w": 311,
        "h": 472,
        "pivotX": 159,
        "pivotY": 471
      },
      {
        "x": 1119,
        "y": 32,
        "w": 329,
        "h": 457,
        "pivotX": 161,
        "pivotY": 456
      },
      {
        "x": 97,
        "y": 528,
        "w": 344,
        "h": 473,
        "pivotX": 159,
        "pivotY": 472
      },
      {
        "x": 578,
        "y": 523,
        "w": 376,
        "h": 478,
        "pivotX": 190,
        "pivotY": 477
      },
      {
        "x": 1090,
        "y": 535,
        "w": 367,
        "h": 466,
        "pivotX": 190,
        "pivotY": 465
      }
    ],
    "sha256": "1addddf6ead7ec914f69601e7f079617ab5f7636435e252355f3cabd65b818db"
  },
  "electric-technician": {
    "name": "찌릿",
    "group": "staff",
    "artStyle": "main-comic",
    "file": "assets/character-motion/electric-technician.webp",
    "fallback": "assets/character-motion/electric-technician-idle.webp",
    "faceReference": "assets/character-portraits/electric-technician.webp",
    "width": 1536,
    "sheetHeight": 1024,
    "height": 456,
    "frames": [
      {
        "x": 99,
        "y": 27,
        "w": 309,
        "h": 456,
        "pivotX": 157,
        "pivotY": 455
      },
      {
        "x": 611,
        "y": 27,
        "w": 309,
        "h": 456,
        "pivotX": 157,
        "pivotY": 455
      },
      {
        "x": 1120,
        "y": 57,
        "w": 371,
        "h": 427,
        "pivotX": 160,
        "pivotY": 426
      },
      {
        "x": 62,
        "y": 568,
        "w": 437,
        "h": 416,
        "pivotX": 194,
        "pivotY": 415
      },
      {
        "x": 590,
        "y": 546,
        "w": 387,
        "h": 438,
        "pivotX": 178,
        "pivotY": 437
      },
      {
        "x": 1095,
        "y": 545,
        "w": 352,
        "h": 439,
        "pivotX": 185,
        "pivotY": 438
      }
    ],
    "sha256": "a6858396c4d3f5c88a23bcc698da2f6c612116e92df888393a3256e23e338d3a"
  }
});
window.CharacterMotion=(()=>{const ids=Object.freeze(["gobi", "electric-technician"]);const known=new Set(ids);return Object.freeze({ids,has:id=>known.has(id),imagePath:id=>known.has(id)?'assets/character-motion/'+id+'-idle.webp':''})})();
