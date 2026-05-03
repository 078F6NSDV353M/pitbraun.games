const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');

const highScoreElement = document.getElementById('highscore');

/* Canvas */
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const UI_SCALE = WIDTH / 480;

/* Grid */
const GRID_COLUMNS = 11;
const GRID_ROWS = 7;

const BLOCK_GAP = 0;
const PLAY_TOP = 10;
const BLOCK_TOP = PLAY_TOP;
const BLOCK_HEIGHT = (WIDTH - BLOCK_GAP * (GRID_COLUMNS + 1)) / GRID_COLUMNS;
const BLOCK_WIDTH = (WIDTH - BLOCK_GAP * (GRID_COLUMNS + 1)) / GRID_COLUMNS;

const NEW_ROW_INTERVAL = 12000;
const BLOCK_SPEED_GROWTH = 1.0135;

/* Paddle */
const KEYBOARD_PADDLE_SPEED = 7 * UI_SCALE;
const BASE_PADDLE_WIDTH = 250;
const PADDLE_SHRINK_PER_LEVEL = 0.0085;
const paddle = {
    width: BASE_PADDLE_WIDTH,
    height: 16 * UI_SCALE,
    x: WIDTH / 2 - BASE_PADDLE_WIDTH / 2,
    y: HEIGHT - 45 * UI_SCALE,
    speed: 0
};

/* Ball */
const BASE_BALL_SPEED = 830;
const BALL_SPEED_GROWTH = 1.0165;
const BALL_TRAIL_LENGTH = 8;
const ballTrail = [];
const ball = {
    x: WIDTH / 2,
    y: HEIGHT - 130,
    prevX: WIDTH / 2,
    prevY: HEIGHT - 1300,
    radius: 8 * UI_SCALE,
    speed: BASE_BALL_SPEED,
    dx: 0,
    dy: 0
};

/* Physics */
const MAX_PHYSICS_STEP = 0.5;

/* Level */
const MAX_LEVEL = 50;
const FIRST_LEVEL_SCORE = 300;
const LEVEL_SCORE_GROWTH = 1.05;

/* Bomb */
const BOMB_CHANCE = 0.02;

/* Freeze */
const FREEZE_CHANCE = 0.01;
const FREEZE_DURATION = 10000;

/* High score */
const HIGH_SCORE_STORAGE_KEY = 'blocks_highscore_value';
const HIGH_SCORE_SIGNATURE_KEY = 'blocks_highscore_signature';
const HIGH_SCORE_SALT = 'pitbraun_blocks_v1';
const COMPLETED_KEY = 'blocks_completed';

/* Save */
const SAVE_COST = 2000;
const SAFE_ZONE_BLOCKS = 3;

const saveButton = {
    x: WIDTH / 2,
    y: HEIGHT - 15 * UI_SCALE,
    width: 80 * UI_SCALE,
    height: 24 * UI_SCALE
};

const keys = {
    left: false,
    right: false
};

let pointerActive = false;
let lastPointerX = 0;
const DOUBLE_TAP_DELAY = 300;

const startButton = {
    x: WIDTH / 2,
    y: HEIGHT * 0.6,
    radius: 50 * UI_SCALE
};

let score = 0;
let level = 1;
let runElapsedTime = 0;
let shineTime = 0;
let highScore = 0;
let gameOver = false;
let gameWon = false;
let isPaused = false;
let gameStarted = false;
let pauseStartedAt = 0;
let blocks = [];
let pendingTopRow = null;
let rowDropOffset = 0;
let freezeUntilTime = 0;
let freezeStoppedAt = 0;
let freezePauseStartedAt = 0;
let particles = [];
let ballVisible = true;
let winAnimationTime = 0;
let winExplosionQueue = [];
let winExplosionStartedAt = 0;
const blockImageCache = new Map();
const blockTextImageCache = new Map();
const specialBlockIconCache = new Map();
const BOMB_ICON_SRC = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJhIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3QgeD0iMCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZjJmMmYyIiBzdHJva2Utd2lkdGg9IjAiLz48cG9seWdvbiBwb2ludHM9IjkgNTUgMCA2NCAwIDAgOSA5IDkgNTUiIGZpbGw9IiNiM2IzYjMiIHN0cm9rZS13aWR0aD0iMCIvPjxwb2x5Z29uIHBvaW50cz0iNTUgNTUgNjQgNjQgNjQgMCA1NSA5IDU1IDU1IiBmaWxsPSIjOTk5IiBzdHJva2Utd2lkdGg9IjAiLz48cmVjdCB4PSI5IiB5PSI5IiB3aWR0aD0iNDYiIGhlaWdodD0iNDYiIGZpbGw9IiNiZmJmYmYiIHN0cm9rZS13aWR0aD0iMCIvPjxwb2x5Z29uIHBvaW50cz0iOSA5IDAgMCA2NCAwIDU1IDkgOSA5IiBmaWxsPSIjZmZmIiBzdHJva2Utd2lkdGg9IjAiLz48cG9seWdvbiBwb2ludHM9IjkgNTUgMCA2NCA2NCA2NCA1NSA1NSA5IDU1IiBmaWxsPSJncmF5IiBzdHJva2Utd2lkdGg9IjAiLz48cGF0aCBkPSJtNDUuMSwxOS41NWMtMy43Mi0uNjMtMTAuNzQuNDktMTQuMDcsNSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNjMzNzAwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjI2LjciIGN5PSIzNy4wMiIgcj0iMTQuNyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEzLjU1IDU4LjU0KSByb3RhdGUoLTgyLjMzKSIgc3Ryb2tlLXdpZHRoPSIwIi8+PHBvbHlnb24gcG9pbnRzPSI0Mi41OCAxNS44OCA0NS4xIDE5LjU1IDQ2LjY2IDEzLjgxIDQ1LjEgMTkuNTUgNTAuNzkgMTcuODIgNDUuMSAxOS41NSA0OS4yMSAyMy43MSA0NS4xIDE5LjU1IDQzLjIxIDI0LjczIDQ1LjEgMTkuNTUgMzkuNjEgMjEuMTMgNDUuMSAxOS41NSA0Mi41OCAxNS44OCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmEwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=';
const FREEZE_ICON_SRC = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJhIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3QgeD0iMCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZjJmMmYyIiBzdHJva2Utd2lkdGg9IjAiLz48cG9seWdvbiBwb2ludHM9IjkgNTUgMCA2NCAwIDAgOSA5IDkgNTUiIGZpbGw9IiNiM2IzYjMiIHN0cm9rZS13aWR0aD0iMCIvPjxwb2x5Z29uIHBvaW50cz0iNTUgNTUgNjQgNjQgNjQgMCA1NSA5IDU1IDU1IiBmaWxsPSIjOTk5IiBzdHJva2Utd2lkdGg9IjAiLz48cmVjdCB4PSI5IiB5PSI5IiB3aWR0aD0iNDYiIGhlaWdodD0iNDYiIGZpbGw9IiNiZmJmYmYiIHN0cm9rZS13aWR0aD0iMCIvPjxwb2x5Z29uIHBvaW50cz0iOSA5IDAgMCA2NCAwIDU1IDkgOSA5IiBmaWxsPSIjZmZmIiBzdHJva2Utd2lkdGg9IjAiLz48cG9seWdvbiBwb2ludHM9IjkgNTUgMCA2NCA2NCA2NCA1NSA1NSA5IDU1IiBmaWxsPSJncmF5IiBzdHJva2Utd2lkdGg9IjAiLz48cGF0aCBkPSJtMjkuNDksMTZjLS4yNS4yNiwwLC42OS4zNS42MWwxLjA2LS4yNGMuMTktLjA0LjM4LjA3LjQzLjI1bC4zMiwxLjA0Yy4xMS4zNS41OS4zNS43LDBsLjMyLTEuMDRjLjA2LS4xOC4yNS0uMjkuNDMtLjI1bDEuMDYuMjRjLjM1LjA4LjYtLjM0LjM1LS42MWwtLjc0LS43OWMtLjEzLS4xNC0uMTMtLjM2LDAtLjVsLjc0LS43OWMuMjUtLjI2LDAtLjY5LS4zNS0uNjFsLTEuMDYuMjRjLS4xOS4wNC0uMzgtLjA3LS40My0uMjVsLS4zMi0xLjA0Yy0uMTEtLjM1LS41OS0uMzUtLjcsMGwtLjMyLDEuMDRjLS4wNi4xOC0uMjUuMjktLjQzLjI1bC0xLjA2LS4yNGMtLjM1LS4wOC0uNi4zNC0uMzUuNjFsLjc0Ljc5Yy4xMy4xNC4xMy4zNiwwLC41bC0uNzQuNzlaIiBmaWxsPSIjMGFmIiBzdHJva2Utd2lkdGg9IjAiLz48cGF0aCBkPSJtMzQuNTEsNDhjLjI1LS4yNiwwLS42OS0uMzUtLjYxbC0xLjA2LjI0Yy0uMTkuMDQtLjM4LS4wNy0uNDMtLjI1bC0uMzItMS4wNGMtLjExLS4zNS0uNTktLjM1LS43LDBsLS4zMiwxLjA0Yy0uMDYuMTgtLjI1LjI5LS40My4yNWwtMS4wNi0uMjRjLS4zNS0uMDgtLjYuMzQtLjM1LjYxbC43NC43OWMuMTMuMTQuMTMuMzYsMCwuNWwtLjc0Ljc5Yy0uMjUuMjYsMCwuNjkuMzUuNjFsMS4wNi0uMjRjLjE5LS4wNC4zOC4wNy40My4yNWwuMzIsMS4wNGMuMTEuMzUuNTkuMzUuNywwbC4zMi0xLjA0Yy4wNi0uMTguMjUtLjI5LjQzLS4yNWwxLjA2LjI0Yy4zNS4wOC42LS4zNC4zNS0uNjFsLS43NC0uNzljLS4xMy0uMTQtLjEzLS4zNiwwLS41bC43NC0uNzlaIiBmaWxsPSIjMGFmIiBzdHJva2Utd2lkdGg9IjAiLz48cGF0aCBkPSJtMTQuNzMsMjQuNTJjLS4yNS4yNiwwLC42OS4zNS42MWwxLjA2LS4yNGMuMTktLjA0LjM4LjA3LjQzLjI1bC4zMiwxLjA0Yy4xMS4zNS41OS4zNS43LDBsLjMyLTEuMDRjLjA2LS4xOC4yNS0uMjkuNDMtLjI1bDEuMDYuMjRjLjM1LjA4LjYtLjM0LjM1LS42MWwtLjc0LS43OWMtLjEzLS4xNC0uMTMtLjM2LDAtLjVsLjc0LS43OWMuMjUtLjI2LDAtLjY5LS4zNS0uNjFsLTEuMDYuMjRjLS4xOS4wNC0uMzgtLjA3LS40My0uMjVsLS4zMi0xLjA0Yy0uMTEtLjM1LS41OS0uMzUtLjcsMGwtLjMyLDEuMDRjLS4wNi4xOC0uMjUuMjktLjQzLjI1bC0xLjA2LS4yNGMtLjM1LS4wOC0uNi4zNC0uMzUuNjFsLjc0Ljc5Yy4xMy4xNC4xMy4zNiwwLC41bC0uNzQuNzlaIiBmaWxsPSIjMGFmIiBzdHJva2Utd2lkdGg9IjAiLz48cGF0aCBkPSJtNDkuMjcsMzkuNDhjLjI1LS4yNiwwLS42OS0uMzUtLjYxbC0xLjA2LjI0Yy0uMTkuMDQtLjM4LS4wNy0uNDMtLjI1bC0uMzItMS4wNGMtLjExLS4zNS0uNTktLjM1LS43LDBsLS4zMiwxLjA0Yy0uMDYuMTgtLjI1LjI5LS40My4yNWwtMS4wNi0uMjRjLS4zNS0uMDgtLjYuMzQtLjM1LjYxbC43NC43OWMuMTMuMTQuMTMuMzYsMCwuNWwtLjc0Ljc5Yy0uMjUuMjYsMCwuNjkuMzUuNjFsMS4wNi0uMjRjLjE5LS4wNC4zOC4wNy40My4yNWwuMzIsMS4wNGMuMTEuMzUuNTkuMzUuNywwbC4zMi0xLjA0Yy4wNi0uMTguMjUtLjI5LjQzLS4yNWwxLjA2LjI0Yy4zNS4wOC42LS4zNC4zNS0uNjFsLS43NC0uNzljLS4xMy0uMTQtLjEzLS4zNiwwLS41bC43NC0uNzlaIiBmaWxsPSIjMGFmIiBzdHJva2Utd2lkdGg9IjAiLz48cGF0aCBkPSJtMTkuNzQsMzkuNDhjLjI1LS4yNiwwLS42OS0uMzUtLjYxbC0xLjA2LjI0Yy0uMTkuMDQtLjM4LS4wNy0uNDMtLjI1bC0uMzItMS4wNGMtLjExLS4zNS0uNTktLjM1LS43LDBsLS4zMiwxLjA0Yy0uMDYuMTgtLjI1LjI5LS40My4yNWwtMS4wNi0uMjRjLS4zNS0uMDgtLjYuMzQtLjM1LjYxbC43NC43OWMuMTMuMTQuMTMuMzYsMCwuNWwtLjc0Ljc5Yy0uMjUuMjYsMCwuNjkuMzUuNjFsMS4wNi0uMjRjLjE5LS4wNC4zOC4wNy40My4yNWwuMzIsMS4wNGMuMTEuMzUuNTkuMzUuNywwbC4zMi0xLjA0Yy4wNi0uMTguMjUtLjI5LjQzLS4yNWwxLjA2LjI0Yy4zNS4wOC42LS4zNC4zNS0uNjFsLS43NC0uNzljLS4xMy0uMTQtLjEzLS4zNiwwLS41bC43NC0uNzlaIiBmaWxsPSIjMGFmIiBzdHJva2Utd2lkdGg9IjAiLz48cGF0aCBkPSJtNDguNTMsMjMuNzNjLS4xMy0uMTQtLjEzLS4zNiwwLS41bC43NC0uNzljLjI1LS4yNiwwLS42OS0uMzUtLjYxbC0xLjA2LjI0Yy0uMTkuMDQtLjM4LS4wNy0uNDMtLjI1bC0uMzItMS4wNGMtLjExLS4zNS0uNTktLjM1LS43LDBsLS4zMiwxLjA0Yy0uMDYuMTgtLjI1LjI5LS40My4yNWwtMS4wNi0uMjRjLS4zNS0uMDgtLjYuMzQtLjM1LjYxbC43NC43OWMuMTMuMTQuMTMuMzYsMCwuNWwtLjc0Ljc5Yy0uMjUuMjYsMCwuNjkuMzUuNjFsMS4wNi0uMjRjLjE5LS4wNC4zOC4wNy40My4yNWwuMzIsMS4wNGMuMTEuMzUuNTkuMzUuNywwbC4zMi0xLjA0Yy4wNi0uMTguMjUtLjI5LjQzLS4yNWwxLjA2LjI0Yy4zNS4wOC42LS4zNC4zNS0uNjFsLS43NC0uNzlaIiBmaWxsPSIjMGFmIiBzdHJva2Utd2lkdGg9IjAiLz48cGF0aCBkPSJtNDMuNDcsMzkuMTdjLS4wOC0uMzUuMTItLjcxLjQ3LS44MmwxLjk2LS42Yy42NS0uMi42NS0xLjEyLDAtMS4zMmwtMS45Ni0uNmMtLjM1LS4xMS0uNTUtLjQ2LS40Ny0uODJsLjQ2LTJjLjE1LS42Ny0uNjUtMS4xMy0xLjE1LS42NmwtMS41LDEuNGMtLjI3LjI1LS42OC4yNS0uOTQsMGwtMS41LTEuNGMtLjUtLjQ3LTEuMywwLTEuMTUuNjZsLjM5LDEuNy0yLjE4LTIuMzNjLS4yLS4yMS0uMi0uNTQsMC0uNzVsMi4xOC0yLjMzLS4zOSwxLjdjLS4xNS42Ny42NSwxLjEzLDEuMTUuNjZsMS41LTEuNGMuMjctLjI1LjY4LS4yNS45NCwwbDEuNSwxLjRjLjUuNDcsMS4zLDAsMS4xNS0uNjZsLS40Ni0yYy0uMDgtLjM1LjEyLS43MS40Ny0uODJsMS45Ni0uNmMuNjUtLjIuNjUtMS4xMiwwLTEuMzJsLTEuOTYtLjZjLS4zNS0uMTEtLjU1LS40Ni0uNDctLjgybC40Ni0yYy4xNS0uNjctLjY1LTEuMTMtMS4xNS0uNjZsLTEuNSwxLjRjLS4yNy4yNS0uNjguMjUtLjk0LDBsLTEuNS0xLjRjLS41LS40Ny0xLjMsMC0xLjE1LjY2bC40NiwyYy4wOC4zNS0uMTIuNzEtLjQ3LjgybC0xLjk2LjZjLS42NS4yLS42NSwxLjEyLDAsMS4zMmwxLjY3LjUxLTMuMTEuNzJjLS4yOC4wNi0uNTYtLjEtLjY1LS4zN2wtLjkzLTMuMDUsMS4yNywxLjE5Yy41LjQ3LDEuMywwLDEuMTUtLjY2bC0uNDYtMmMtLjA4LS4zNS4xMi0uNzEuNDctLjgybDEuOTYtLjZjLjY1LS4yLjY1LTEuMTIsMC0xLjMybC0xLjk2LS42Yy0uMzUtLjExLS41NS0uNDYtLjQ3LS44MmwuNDYtMmMuMTUtLjY3LS42NS0xLjEzLTEuMTUtLjY2bC0xLjUsMS40Yy0uMjcuMjUtLjY4LjI1LS45NCwwbC0xLjUtMS40Yy0uNS0uNDctMS4zLDAtMS4xNS42NmwuNDYsMmMuMDguMzUtLjEyLjcxLS40Ny44MmwtMS45Ni42Yy0uNjUuMi0uNjUsMS4xMiwwLDEuMzJsMS45Ni42Yy4zNS4xMS41NS40Ni40Ny44MmwtLjQ2LDJjLS4xNS42Ny42NSwxLjEzLDEuMTUuNjZsMS4yNy0xLjE5LS45MywzLjA1Yy0uMDguMjgtLjM3LjQ0LS42NS4zN2wtMy4xMS0uNzIsMS42Ny0uNTFjLjY1LS4yLjY1LTEuMTIsMC0xLjMybC0xLjk2LS42Yy0uMzUtLjExLS41NS0uNDYtLjQ3LS44MmwuNDYtMmMuMTUtLjY3LS42NS0xLjEzLTEuMTUtLjY2bC0xLjUsMS40Yy0uMjcuMjUtLjY4LjI1LS45NCwwbC0xLjUtMS40Yy0uNS0uNDctMS4zLDAtMS4xNS42NmwuNDYsMmMuMDguMzUtLjEyLjcxLS40Ny44MmwtMS45Ni42Yy0uNjUuMi0uNjUsMS4xMiwwLDEuMzJsMS45Ni42Yy4zNS4xMS41NS40Ni40Ny44MmwtLjQ2LDJjLS4xNS42Ny42NSwxLjEzLDEuMTUuNjZsMS41LTEuNGMuMjctLjI1LjY4LS4yNS45NCwwbDEuNSwxLjRjLjUuNDcsMS4zLDAsMS4xNS0uNjZsLS4zOS0xLjcsMi4xOCwyLjMzYy4yLjIxLjIuNTQsMCwuNzVsLTIuMTgsMi4zMy4zOS0xLjdjLjE1LS42Ny0uNjUtMS4xMy0xLjE1LS42NmwtMS41LDEuNGMtLjI3LjI1LS42OC4yNS0uOTQsMGwtMS41LTEuNGMtLjUtLjQ3LTEuMywwLTEuMTUuNjZsLjQ2LDJjLjA4LjM1LS4xMi43MS0uNDcuODJsLTEuOTYuNmMtLjY1LjItLjY1LDEuMTIsMCwxLjMybDEuOTYuNmMuMzUuMTEuNTUuNDYuNDcuODJsLS40NiwyYy0uMTUuNjcuNjUsMS4xMywxLjE1LjY2bDEuNS0xLjRjLjI3LS4yNS42OC0uMjUuOTQsMGwxLjUsMS40Yy41LjQ3LDEuMywwLDEuMTUtLjY2bC0uNDYtMmMtLjA4LS4zNS4xMi0uNzEuNDctLjgybDEuOTYtLjZjLjY1LS4yLjY1LTEuMTIsMC0xLjMybC0xLjY3LS41MSwzLjExLS43MmMuMjgtLjA2LjU2LjEuNjUuMzdsLjkzLDMuMDUtMS4yNy0xLjE5Yy0uNS0uNDctMS4zLDAtMS4xNS42NmwuNDYsMmMuMDguMzUtLjEyLjcxLS40Ny44MmwtMS45Ni42Yy0uNjUuMi0uNjUsMS4xMiwwLDEuMzJsMS45Ni42Yy4zNS4xMS41NS40Ni40Ny44MmwtLjQ2LDJjLS4xNS42Ny42NSwxLjEzLDEuMTUuNjZsMS41LTEuNGMuMjctLjI1LjY4LS4yNS45NCwwbDEuNSwxLjRjLjUuNDcsMS4zLDAsMS4xNS0uNjZsLS40Ni0yYy0uMDgtLjM1LjEyLS43MS40Ny0uODJsMS45Ni0uNmMuNjUtLjIuNjUtMS4xMiwwLTEuMzJsLTEuOTYtLjZjLS4zNS0uMTEtLjU1LS40Ni0uNDctLjgybC40Ni0yYy4xNS0uNjctLjY1LTEuMTMtMS4xNS0uNjZsLTEuMjcsMS4xOS45My0zLjA1Yy4wOC0uMjguMzctLjQ0LjY1LS4zN2wzLjExLjcyLTEuNjcuNTFjLS42NS4yLS42NSwxLjEyLDAsMS4zMmwxLjk2LjZjLjM1LjExLjU1LjQ2LjQ3LjgybC0uNDYsMmMtLjE1LjY3LjY1LDEuMTMsMS4xNS42NmwxLjUtMS40Yy4yNy0uMjUuNjgtLjI1Ljk0LDBsMS41LDEuNGMuNS40NywxLjMsMCwxLjE1LS42NmwtLjQ2LTJaIiBmaWxsPSIjMGFmIiBzdHJva2Utd2lkdGg9IjAiLz48L3N2Zz4=';
let lastNewRowTime = performance.now();
let lastFrameTime = performance.now();
let fps = 0;
let fpsCounter = 0;
let fpsTime = 0;

const bombIconImage = new Image();
bombIconImage.src = BOMB_ICON_SRC;

const freezeIconImage = new Image();
freezeIconImage.src = FREEZE_ICON_SRC;

const BLOCK_TYPES = [
    { color: '#ff0000', points: 10 },
    { color: '#ff7f00', points: 15 },
    { color: '#ffff00', points: 20 },
    { color: '#00ff00', points: 25 },
    { color: '#00ffff', points: 30 },
    { color: '#0000ff', points: 35 },
    { color: '#8b00ff', points: 40 },
    { color: '#ff1493', points: 50 }
];

function createRow() {
    const row = [];

    for (let col = 0; col < GRID_COLUMNS; col++) {
    const type = BLOCK_TYPES[Math.floor(Math.random() * BLOCK_TYPES.length)];
    const specialRoll = Math.random();
    const isBomb = specialRoll < BOMB_CHANCE;
    const isFreeze = !isBomb && specialRoll < BOMB_CHANCE + FREEZE_CHANCE;

    row.push({
        active: true,
        color: isBomb ? '#ffffff' : isFreeze ? '#93c5fd' : type.color,
        points: isBomb || isFreeze ? 0 : type.points,
        isBomb: isBomb,
        isFreeze: isFreeze,
        shinePhase: Math.random(),
        shineDuration: Math.random(),
        shineInterval: Math.random()
    });
    }

    return row;
}

function resetBlocks() {
    blocks = [];
    rowDropOffset = 0;
    freezeUntilTime = 0;
    freezePauseStartedAt = 0;
    pendingTopRow = createRow();

    for (let row = 0; row < GRID_ROWS; row++) {
    blocks.push(createRow());
    }
}

function addNewTopRow() {
    blocks.unshift(pendingTopRow || createRow());
    pendingTopRow = createRow();
    rowDropOffset = 0;
}

function getBlockY(row) {
    return BLOCK_TOP + row * (BLOCK_HEIGHT + BLOCK_GAP) + rowDropOffset;
}

function getPendingRowY() {
    return BLOCK_TOP - BLOCK_HEIGHT - BLOCK_GAP + rowDropOffset;
}

function addRows(count) {
    for (let i = 0; i < count; i++) {
    addNewTopRow();
    }
}

function hasActiveBlocks() {
    return blocks.some(row => row.some(block => block.active));
}

function refillBlocksIfEmpty() {
    if (gameWon || hasActiveBlocks()) {
    return;
    }

    if (!pendingTopRow || !pendingTopRow.some(block => block.active)) {
    pendingTopRow = createRow();
    rowDropOffset = 0;
    lastNewRowTime = performance.now();
    }
}

function checkClearedRows() {
    // Cleared rows stay empty.
    // New rows are added by the timer or by full field cleanup.
}

function movePaddleByPointerDelta(clientX) {
    if (!gameStarted || isPaused || gameOver || gameWon) {
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const deltaX = (clientX - lastPointerX) * scaleX;

    paddle.x += deltaX;
    paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, paddle.x));
    lastPointerX = clientX;
}

window.addEventListener('mousedown', event => {
    if (isPaused || gameOver || gameWon) {
    return;
    }

    pointerActive = true;
    lastPointerX = event.clientX;
});

window.addEventListener('mousemove', event => {
    if (!pointerActive) {
    return;
    }

    movePaddleByPointerDelta(event.clientX);
});

window.addEventListener('mouseup', () => {
    pointerActive = false;
});

window.addEventListener('touchstart', event => {
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];

    const x = (touch.clientX - rect.left) * (WIDTH / rect.width);
    const y = (touch.clientY - rect.top) * (HEIGHT / rect.height);

    if (isPaused && !gameOver && !gameWon) {
        event.preventDefault();

        const dx = x - startButton.x;
        const dy = y - startButton.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= startButton.radius) {
            const pauseDuration = performance.now() - pauseStartedAt;
            lastNewRowTime += pauseDuration;
            freezeUntilTime += pauseDuration;
            pauseStartedAt = 0;
            isPaused = false;
        }

        return;
    }

    if (gameStarted && !gameOver && !gameWon && !isPaused) {
        const saveLeft = saveButton.x - saveButton.width / 2;
        const saveRight = saveButton.x + saveButton.width / 2;
        const saveTop = saveButton.y - saveButton.height / 2;
        const saveBottom = saveButton.y + saveButton.height / 2;

        if (x >= saveLeft && x <= saveRight && y >= saveTop && y <= saveBottom) {
            event.preventDefault();
            useSaveButton();
            lastTapTime = 0;
            return;
        }
    }

    const now = performance.now();

    if (gameStarted && !gameOver && !gameWon && now - lastTapTime <= DOUBLE_TAP_DELAY) {
        event.preventDefault();

        if (isPaused) {
            const pauseDuration = performance.now() - pauseStartedAt;
            lastNewRowTime += pauseDuration;
            freezeUntilTime += pauseDuration;
            pauseStartedAt = 0;
            isPaused = false;
        } else {
            pauseStartedAt = performance.now();
            isPaused = true;
        }

        keys.left = false;
        keys.right = false;
        pointerActive = false;
        lastTapTime = 0;
        return;
    }

    lastTapTime = now;

    if (!gameStarted) {
        event.preventDefault();

        const dx = x - startButton.x;
        const dy = y - startButton.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= startButton.radius) {
            gameStarted = true;
            lastNewRowTime = performance.now();
            runElapsedTime = 0;
        }

        return;
    }

    if (gameOver || gameWon) {
        event.preventDefault();

        const dx = x - startButton.x;
        const dy = y - startButton.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= startButton.radius) {
            restartGame();
            gameStarted = true;
            lastNewRowTime = performance.now();
            runElapsedTime = 0;
            lastTapTime = 0;
        }

        return;
    }

    event.preventDefault();
    pointerActive = true;
    lastPointerX = event.touches[0].clientX;
}, { passive: false });

window.addEventListener('touchmove', event => {
    event.preventDefault();

    if (!pointerActive) {
    return;
    }

    movePaddleByPointerDelta(event.touches[0].clientX);
}, { passive: false });

window.addEventListener('touchend', () => {
    pointerActive = false;
});

canvas.addEventListener('click', (event) => {
    if (isPaused && !gameOver && !gameWon) {
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (WIDTH / rect.width);
        const y = (event.clientY - rect.top) * (HEIGHT / rect.height);

        const dx = x - startButton.x;
        const dy = y - startButton.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= startButton.radius) {
            const pauseDuration = performance.now() - pauseStartedAt;
            lastNewRowTime += pauseDuration;
            freezeUntilTime += pauseDuration;
            pauseStartedAt = 0;
            isPaused = false;
        }

        return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (WIDTH / rect.width);
    const y = (event.clientY - rect.top) * (HEIGHT / rect.height);

    if (gameStarted && !gameOver && !gameWon && !isPaused) {
        const saveLeft = saveButton.x - saveButton.width / 2;
        const saveRight = saveButton.x + saveButton.width / 2;
        const saveTop = saveButton.y - saveButton.height / 2;
        const saveBottom = saveButton.y + saveButton.height / 2;

        if (x >= saveLeft && x <= saveRight && y >= saveTop && y <= saveBottom) {
            useSaveButton();
            return;
        }
    }

    if (!gameStarted) {
        const dx = x - startButton.x;
        const dy = y - startButton.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= startButton.radius) {
            gameStarted = true;
            lastNewRowTime = performance.now();
            runElapsedTime = 0;
        }

        return;
    }

    if (gameOver || gameWon) {
        const dx = x - startButton.x;
        const dy = y - startButton.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= startButton.radius) {
            restartGame();
            gameStarted = true;
            lastNewRowTime = performance.now();
            runElapsedTime = 0;
        }

        return;
    }
});

window.addEventListener('keydown', event => {
    if (!isPaused && !gameOver && !gameWon && event.key === 'ArrowLeft') {
    keys.left = true;
    }

    if (!isPaused && !gameOver && !gameWon && event.key === 'ArrowRight') {
    keys.right = true;
    }

    if (event.code === 'Space') {
        if (!gameStarted) {
            gameStarted = true;
            lastNewRowTime = performance.now();
            runElapsedTime = 0;
            return;
        }

        if (gameOver || gameWon) {
            restartGame();
            gameStarted = true;
            return;
        }

        if (isPaused) {
            const pauseDuration = performance.now() - pauseStartedAt;
            lastNewRowTime += pauseDuration;
            freezeUntilTime += pauseDuration;
            pauseStartedAt = 0;
            isPaused = false;
        } else {
            pauseStartedAt = performance.now();
            isPaused = true;
        }

        keys.left = false;
        keys.right = false;
        pointerActive = false;
    }
});

window.addEventListener('keyup', event => {
    if (event.key === 'ArrowLeft') {
    keys.left = false;
    }

    if (event.key === 'ArrowRight') {
    keys.right = false;
    }
});

function createHighScoreSignature(value) {
    const raw = `${HIGH_SCORE_SALT}:${value}:${value * 31 + 17}`;
    let hash = 0;

    for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
    }

    return String(hash);
}

function loadHighScore() {
    try {
        const value = Number.parseInt(localStorage.getItem(HIGH_SCORE_STORAGE_KEY) || '0', 10);
        const signature = localStorage.getItem(HIGH_SCORE_SIGNATURE_KEY);

        if (!Number.isFinite(value) || value < 0) {
            return 0;
        }

        if (signature !== createHighScoreSignature(value)) {
            localStorage.removeItem(HIGH_SCORE_STORAGE_KEY);
            localStorage.removeItem(HIGH_SCORE_SIGNATURE_KEY);
            return 0;
        }

        return value;
    } catch (error) {
        return 0;
    }
}

function saveHighScore(value) {
    try {
        localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(value));
        localStorage.setItem(HIGH_SCORE_SIGNATURE_KEY, createHighScoreSignature(value));
    } catch (error) {
    }
}

function restartGame() {
    isPaused = false;
    gameOver = false;
    gameWon = false;
    freezeStoppedAt = 0;
    score = 0;
    level = 1;
    particles = [];
    ballVisible = true;
    runStartTime = 0;
    runElapsedTime = 0;
    scoreElement.textContent = score;
    levelElement.textContent = level;
    
    lastNewRowTime = performance.now();
    lastFrameTime = performance.now();

    paddle.width = BASE_PADDLE_WIDTH;
    paddle.x = WIDTH / 2 - paddle.width / 2;
    ball.x = WIDTH / 2;
    ball.y = HEIGHT - 130;
    ball.prevX = ball.x;
    ball.prevY = ball.y;
    ball.speed = BASE_BALL_SPEED;
    setBallDirection(0, -1);

    highScore = loadHighScore();

    const isCompleted = localStorage.getItem(COMPLETED_KEY) === '1';

    if (isCompleted) {
        highScoreElement.textContent = '★ ' + highScore + ' ★';
    } else {
        highScoreElement.textContent = highScore;
    }

    resetBlocks();
}

function drawDangerLine() {
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, paddle.y);
    ctx.lineTo(WIDTH, paddle.y);
    ctx.stroke();
}

function drawSafeZone() {
    const safeZoneHeight = BLOCK_HEIGHT * SAFE_ZONE_BLOCKS;
    const safeZoneY = paddle.y - safeZoneHeight;

    ctx.save();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(0, safeZoneY, WIDTH, safeZoneHeight);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, safeZoneY, WIDTH, safeZoneHeight);

    ctx.restore();
}

function drawPaddle() {
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function getRemainingFreezeTime() {
    const now =
        freezeStoppedAt > 0
            ? freezeStoppedAt
            : (isPaused && pauseStartedAt > 0)
                ? pauseStartedAt
                : performance.now();

    return Math.max(0, freezeUntilTime - now);
}

function drawFreezeTimer() {
    const remainingFreezeTime = getRemainingFreezeTime();

    if (remainingFreezeTime <= 0) {
        return;
    }

    const seconds = Math.ceil(remainingFreezeTime / 1000);
    const label = `Freeze: ${seconds}s`;

    ctx.fillStyle = '#dbeafe';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, 10, HEIGHT - 2);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
}

function drawRunTimer() {

    const totalSeconds = runElapsedTime / 1000; 
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const hundredths = Math.floor((totalSeconds % 1) * 100);

    const label =
        `Run: ${String(minutes).padStart(2, '0')}:` +
        `${String(seconds).padStart(2, '0')}.` +
        `${String(hundredths).padStart(2, '0')}`;

    ctx.fillStyle = 'rgb(0, 255, 0)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, WIDTH - 10, HEIGHT - 3);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
}

function drawBall() {
    if (!ballVisible) {
        return;
    }

    const isCompleted = localStorage.getItem(COMPLETED_KEY) === '1';

    for (let i = ballTrail.length - 1; i >= 0; i--) {
        const trailPoint = ballTrail[i];
        const progress = 1 - i / ballTrail.length;
        const alpha = progress * 0.35;
        const radius = ball.radius * (0.45 + progress * 0.45);

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(trailPoint.x, trailPoint.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isCompleted ? '#ffd700' : '#ffffff';
        ctx.fill();
    }

    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = isCompleted ? '#ffd700' : '#ffffff';
    ctx.fill();
}

function getTextColorForBlock(hexColor) {
    const red = parseInt(hexColor.slice(1, 3), 16);
    const green = parseInt(hexColor.slice(3, 5), 16);
    const blue = parseInt(hexColor.slice(5, 7), 16);
    const brightness = red * 0.299 + green * 0.587 + blue * 0.114;

    return brightness > 140 ? '#000000' : '#ffffff';
}

function shadeHexColor(hexColor, amount) {
    const red = Math.max(0, Math.min(255, parseInt(hexColor.slice(1, 3), 16) + amount));
    const green = Math.max(0, Math.min(255, parseInt(hexColor.slice(3, 5), 16) + amount));
    const blue = Math.max(0, Math.min(255, parseInt(hexColor.slice(5, 7), 16) + amount));

    return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
}

function isLightColor(hex) {
    return hex === '#ffff00' || hex === '#00ff00' || hex === '#00ffff' || hex === '#ffffff' || hex === '#93c5fd';
}

function getBlockImage(color) {
    if (blockImageCache.has(color)) {
    return blockImageCache.get(color);
    }

    const light = isLightColor(color);
    const top = shadeHexColor(color, light ? 20 : 85);
    const left = shadeHexColor(color, light ? -65 : 35);
    const right = shadeHexColor(color, light ? -95 : -45);
    const center = shadeHexColor(color, light ? -35 : 45);
    const bottom = shadeHexColor(color, light ? -115 : -80);
    const base = shadeHexColor(color, light ? -20 : 30);

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <rect x="0" y="0" width="64" height="64" fill="${base}" />
        <polygon points="9 55 0 64 0 0 9 9 9 55" fill="${left}" />
        <polygon points="55 55 64 64 64 0 55 9 55 55" fill="${right}" />
        <rect x="9" y="9" width="46" height="46" fill="${center}" />
        <polygon points="9 9 0 0 64 0 55 9 9 9" fill="${top}" />
        <polygon points="9 55 0 64 64 64 55 55 9 55" fill="${bottom}" />
        </svg>`;

    const image = new Image();
    image.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    blockImageCache.set(color, image);
    return image;
}

function getSpecialBlockIcon(type) {
    return type === 'bomb' ? bombIconImage : freezeIconImage;
}

function getBlockTextImage(block) {
    const label = String(block.points);
    const key = `${block.color}|${label}`;

    if (blockTextImageCache.has(key)) {
    return blockTextImageCache.get(key);
    }

    const textCanvas = document.createElement('canvas');
    textCanvas.width = BLOCK_WIDTH;
    textCanvas.height = BLOCK_HEIGHT;

    const textCtx = textCanvas.getContext('2d');
    textCtx.fillStyle = getTextColorForBlock(block.color);
    textCtx.font = `${12 * UI_SCALE}px Arial`;
    textCtx.textAlign = 'center';
    textCtx.textBaseline = 'middle';
    textCtx.fillText(label, BLOCK_WIDTH / 2, BLOCK_HEIGHT / 2);

    blockTextImageCache.set(key, textCanvas);
    return textCanvas;
}

function getRenderedBlockImage(block) {
    const type = block.isBomb ? 'bomb' : block.isFreeze ? 'freeze' : 'normal';
    const label = String(block.points);
    const key = `${type}|${block.color}|${label}`;

    if (blockTextImageCache.has(key)) {
        return blockTextImageCache.get(key);
    }

    const baseImage = getBlockImage(block.color);

    if (!baseImage.complete) {
        return baseImage;
    }

    const renderedCanvas = document.createElement('canvas');
    renderedCanvas.width = BLOCK_WIDTH;
    renderedCanvas.height = BLOCK_HEIGHT;

    const renderedCtx = renderedCanvas.getContext('2d');

    renderedCtx.drawImage(baseImage, 0, 0, BLOCK_WIDTH, BLOCK_HEIGHT);

    if (block.isBomb) {
        const icon = getSpecialBlockIcon('bomb');

        if (icon.complete) {
            renderedCtx.drawImage(icon, 0, 0, BLOCK_WIDTH, BLOCK_HEIGHT);
        }
    } else if (block.isFreeze) {
        const icon = getSpecialBlockIcon('freeze');

        if (icon.complete) {
            renderedCtx.drawImage(icon, 0, 0, BLOCK_WIDTH, BLOCK_HEIGHT);
        }
    } else {
        renderedCtx.fillStyle = getTextColorForBlock(block.color);
        renderedCtx.font = `${12 * UI_SCALE}px Arial`;
        renderedCtx.textAlign = 'center';
        renderedCtx.textBaseline = 'middle';
        renderedCtx.fillText(label, BLOCK_WIDTH / 2, BLOCK_HEIGHT / 2);
    }

    blockTextImageCache.set(key, renderedCanvas);
    return renderedCanvas;
}

function drawBlock(block, x, y) {
    ctx.drawImage(getRenderedBlockImage(block), x, y, BLOCK_WIDTH, BLOCK_HEIGHT);

    const isCompleted = localStorage.getItem(COMPLETED_KEY) === '1';

    if (!isCompleted || block.isBomb || block.isFreeze) {
        return;
    }

    const time = shineTime;

    const duration = 1.5 + block.shineDuration * 0.45;
    const interval = 3.5 + block.shineInterval * 5.5;
    const phase = block.shinePhase * interval;
    const cycle = (time + phase) % interval;

    if (cycle > duration) {
        return;
    }

    const progress = cycle / duration;
    const shineX = x - BLOCK_WIDTH + progress * BLOCK_WIDTH * 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, BLOCK_WIDTH, BLOCK_HEIGHT);
    ctx.clip();

    ctx.globalAlpha = 0.18;
    ctx.translate(shineX, y);
    ctx.rotate(-0.5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, BLOCK_WIDTH * 0.18, BLOCK_HEIGHT * 1.6);

    ctx.restore();
    ctx.globalAlpha = 1;
}

function drawPendingTopRow() {
    if (!pendingTopRow) {
    return;
    }

    const y = getPendingRowY();

    for (let col = 0; col < GRID_COLUMNS; col++) {
    const block = pendingTopRow[col];

    if (!block.active) {
        continue;
    }

    const x = BLOCK_GAP + col * (BLOCK_WIDTH + BLOCK_GAP);
    drawBlock(block, x, y);
    }
}

function drawBlocks() {
    for (let row = 0; row < blocks.length; row++) {
    for (let col = 0; col < GRID_COLUMNS; col++) {
        const block = blocks[row][col];

        if (!block.active) {
        continue;
        }

        const x = BLOCK_GAP + col * (BLOCK_WIDTH + BLOCK_GAP);
        const y = getBlockY(row);

        drawBlock(block, x, y);
    }
    }
}

function addExplosion(row, col, color, power = 1) {
    const cx = BLOCK_GAP + col * (BLOCK_WIDTH + BLOCK_GAP) + BLOCK_WIDTH / 2;
    const cy = BLOCK_TOP + row * (BLOCK_HEIGHT + BLOCK_GAP) + BLOCK_HEIGHT / 2;
    const particleCount = Math.round(18 * power);

    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.6 + Math.random() * 2.1) * power;
        const lifeSpeed = 0.006 + Math.random() * 0.009;

        particles.push({
            x: cx + (Math.random() - 0.5) * BLOCK_WIDTH * 0.35,
            y: cy + (Math.random() - 0.5) * BLOCK_HEIGHT * 0.35,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: (1.4 + Math.random() * 3.4) * power,
            life: 1,
            lifeSpeed: lifeSpeed,
            color: color
        });
    }
}

function updateExplosions(deltaScale) {
    particles = particles.filter(particle => {
        particle.x += particle.vx * deltaScale;
        particle.y += particle.vy * deltaScale;
        particle.vy += 0.015 * deltaScale;
        particle.life -= particle.lifeSpeed * deltaScale;
        return particle.life > 0;
    });
}

function drawExplosions() {
    for (const particle of particles) {
    ctx.globalAlpha = particle.life;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    ctx.globalAlpha = 1;
    }
}

function setBallDirection(dx, dy) {
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
    ball.dx = 0;
    ball.dy = -ball.speed;
    return;
    }

    ball.dx = (dx / length) * ball.speed;
    ball.dy = (dy / length) * ball.speed;
}

function getLevelByScore(currentScore) {
    let calculatedLevel = 1;
    let totalScoreNeeded = 0;
    let levelScoreNeeded = FIRST_LEVEL_SCORE;

    while (calculatedLevel < MAX_LEVEL) {
    totalScoreNeeded += Math.round(levelScoreNeeded);

    if (currentScore < totalScoreNeeded) {
        break;
    }

    calculatedLevel++;
    levelScoreNeeded *= LEVEL_SCORE_GROWTH;
    }

    return calculatedLevel;
}

function getScoreRequiredToCompleteGame() {
    let totalScoreNeeded = 0;
    let levelScoreNeeded = FIRST_LEVEL_SCORE;

    for (let i = 1; i <= MAX_LEVEL; i++) {
    totalScoreNeeded += Math.round(levelScoreNeeded);
    levelScoreNeeded *= LEVEL_SCORE_GROWTH;
    }

    return totalScoreNeeded;
}

function explodeAllBlocksForWin() {
    winExplosionQueue = [];

    if (pendingTopRow) {
        const pendingY = getPendingRowY();

        for (let col = 0; col < GRID_COLUMNS; col++) {
            const block = pendingTopRow[col];

            if (!block || !block.active) {
                continue;
            }

            winExplosionQueue.push({
                block: block,
                row: -1,
                col: col,
                color: block.color,
                delayMs: Math.random() * 2500,
                y: pendingY
            });
        }
    }

    for (let row = 0; row < blocks.length; row++) {
        const y = getBlockY(row);

        for (let col = 0; col < GRID_COLUMNS; col++) {
            const block = blocks[row][col];

            if (!block || !block.active) {
                continue;
            }

            winExplosionQueue.push({
                block: block,
                row: row,
                col: col,
                color: block.color,
                delayMs: Math.random() * 2500,
                y: y
            });
        }
    }

    winExplosionQueue.sort((a, b) => a.delay - b.delay);
}

function updateWinExplosions() {
    const elapsedMs = performance.now() - winExplosionStartedAt;

    for (const item of winExplosionQueue) {
        if (item.delayMs > elapsedMs) {
            continue;
        }

        if (!item.block.active) {
            continue;
        }

        item.block.active = false;
        addExplosion(item.row, item.col, item.color, 1.4);
    }

    winExplosionQueue = winExplosionQueue.filter(item => item.block.active);
}

function addBallWinExplosion() {
    const particleCount = 80;

    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.2 + Math.random() * 4.2;
        const lifeSpeed = 0.004 + Math.random() * 0.008;

        particles.push({
            x: ball.x,
            y: ball.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2.0 + Math.random() * 5.0,
            life: 1,
            lifeSpeed: lifeSpeed,
            color: '#ffd700'
        });
    }
}

function checkWinCondition() {
    if (gameWon) {
        return;
    }

    if (score >= getScoreRequiredToCompleteGame()) {
        gameWon = true;
        winAnimationTime = 0;
        winExplosionStartedAt = performance.now();
        localStorage.setItem(COMPLETED_KEY, '1');
        ballVisible = false;
        addBallWinExplosion();
        explodeAllBlocksForWin();
    }
}

function getSpeedByLevel(currentLevel) {
    return BASE_BALL_SPEED * Math.pow(BALL_SPEED_GROWTH, currentLevel - 1);
}

function getPaddleWidthByLevel(currentLevel) {
    const shrink = BASE_PADDLE_WIDTH * PADDLE_SHRINK_PER_LEVEL * (currentLevel - 1);
    return Math.max(BASE_PADDLE_WIDTH * 0.35, BASE_PADDLE_WIDTH - shrink);
}

function updateLevelAndSpeed() {
    const newLevel = getLevelByScore(score);

    if (newLevel === level) {
    return;
    }

    level = newLevel;
    ball.speed = getSpeedByLevel(level);
    paddle.width = getPaddleWidthByLevel(level);
    paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, paddle.x));
    setBallDirection(ball.dx, ball.dy);
    levelElement.textContent = level;
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#ffffff';
    ctx.font = '72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2 - 18);

    ctx.font = '18px Arial';
    ctx.fillText(' ', WIDTH / 2, HEIGHT / 2 + 18);
    ctx.textAlign = 'left';
}

function drawWin() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const pulse = Math.sin(winAnimationTime * 8) * 0.5 + 0.5;
    const glow = 12 + pulse * 18;

    ctx.save();

    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = glow;
    ctx.fillStyle = '#ffd700';
    ctx.font = '120px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('WIN', WIDTH / 2, HEIGHT / 2 - 30);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.fillText('Press restart to play again', WIDTH / 2, HEIGHT / 2 + 24);

    ctx.restore();
}

function collideWithWalls() {
    if (ball.x - ball.radius <= 0) {
    ball.x = ball.radius;
    ball.dx = Math.abs(ball.dx);
    }

    if (ball.x + ball.radius >= WIDTH) {
    ball.x = WIDTH - ball.radius;
    ball.dx = -Math.abs(ball.dx);
    }

    if (ball.y - ball.radius <= PLAY_TOP) {
        ball.y = PLAY_TOP + ball.radius;
        ball.dy = Math.abs(ball.dy);
    }

    if (ball.y - ball.radius > HEIGHT) {
    gameOver = true;
    
    }
}

function collideWithPaddle() {
    const paddleTop = paddle.y;
    const paddleBottom = paddle.y + paddle.height;
    const paddleLeft = paddle.x;
    const paddleRight = paddle.x + paddle.width;

    const previousBallRight = ball.prevX + ball.radius;
    const previousBallLeft = ball.prevX - ball.radius;
    const previousBallBottom = ball.prevY + ball.radius;
    const previousBallTop = ball.prevY - ball.radius;

    const currentBallRight = ball.x + ball.radius;
    const currentBallLeft = ball.x - ball.radius;
    const currentBallBottom = ball.y + ball.radius;
    const currentBallTop = ball.y - ball.radius;

    const movingDown = ball.dy > 0;
    const crossedPaddleTop =
    movingDown &&
    previousBallBottom <= paddleTop &&
    currentBallBottom >= paddleTop;

    if (crossedPaddleTop) {
    const movementY = ball.y - ball.prevY;
    let hitX = ball.x;

    if (movementY !== 0) {
        let hitTime = (paddleTop - previousBallBottom) / movementY;
        hitTime = Math.max(0, Math.min(1, hitTime));
        hitX = ball.prevX + (ball.x - ball.prevX) * hitTime;
    }

    const circleTouchesPaddleTop =
        hitX + ball.radius >= paddleLeft &&
        hitX - ball.radius <= paddleRight;

    if (circleTouchesPaddleTop) {
        const safeHitX = Math.max(paddleLeft, Math.min(paddleRight, hitX));
        const paddleCenter = paddle.x + paddle.width / 2;
        const rawHitPosition = (safeHitX - paddleCenter) / (paddle.width / 2);
        const hitPosition = Math.max(-0.85, Math.min(0.85, rawHitPosition));

        const angle = hitPosition * Math.PI / 3;
        setBallDirection(Math.sin(angle), -Math.cos(angle));

        ball.x = safeHitX;
        ball.y = paddleTop - ball.radius - 0.5;
        ball.prevX = ball.x;
        ball.prevY = ball.y;
        return;
    }
    }

    const verticalOverlap =
    currentBallBottom >= paddleTop &&
    currentBallTop <= paddleBottom;

    if (!verticalOverlap) {
    return;
    }

    const crossedLeftSide =
    ball.dx > 0 &&
    previousBallRight <= paddleLeft &&
    currentBallRight >= paddleLeft;

    const crossedRightSide =
    ball.dx < 0 &&
    previousBallLeft >= paddleRight &&
    currentBallLeft <= paddleRight;

    if (crossedLeftSide) {
    ball.x = paddleLeft - ball.radius - 0.5;
    ball.dx = -Math.abs(ball.dx);
    ball.prevX = ball.x;
    ball.prevY = ball.y;
    return;
    }

    if (crossedRightSide) {
    ball.x = paddleRight + ball.radius + 0.5;
    ball.dx = Math.abs(ball.dx);
    ball.prevX = ball.x;
    ball.prevY = ball.y;
    }
}

function getBlockAt(row, col) {
    if (col < 0 || col >= GRID_COLUMNS) {
    return null;
    }

    if (row === -1) {
    return pendingTopRow ? pendingTopRow[col] : null;
    }

    return blocks[row]?.[col] || null;
}

function destroyBlock(row, col) {
    const block = getBlockAt(row, col);

    if (!block || !block.active) {
    return 0;
    }

    block.active = false;
    return block.points;
}

function useSaveButton() {
    if (!gameStarted || gameOver || gameWon || isPaused) {
        return;
    }

    if (score < SAVE_COST) {
        return;
    }

    const safeZoneTop = paddle.y - BLOCK_HEIGHT * SAFE_ZONE_BLOCKS;
    const safeZoneBottom = paddle.y;

    let destroyedAnyBlock = false;

    for (let row = 0; row < blocks.length; row++) {
        const y = getBlockY(row);

        if (y + BLOCK_HEIGHT < safeZoneTop || y > safeZoneBottom) {
            continue;
        }

        for (let col = 0; col < GRID_COLUMNS; col++) {
            const block = blocks[row][col];

            if (!block || !block.active) {
                continue;
            }

            block.active = false;
            destroyedAnyBlock = true;
            addExplosion(row, col, block.color, 0.9);
        }
    }

    if (!destroyedAnyBlock) {
        return;
    }

    score = Math.max(0, score - SAVE_COST);
    scoreElement.textContent = score;

    const newLevel = getLevelByScore(score);
    level = newLevel;
    ball.speed = getSpeedByLevel(level);
    paddle.width = getPaddleWidthByLevel(level);
    paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, paddle.x));
    setBallDirection(ball.dx, ball.dy);
    levelElement.textContent = level;
}

function explodeBomb(centerRow, centerCol) {
    let pointsEarned = 0;
    const bombsToExplode = [{ row: centerRow, col: centerCol }];
    const explodedBombs = new Set();

    while (bombsToExplode.length > 0) {
    const currentBomb = bombsToExplode.shift();
    const bombKey = `${currentBomb.row}|${currentBomb.col}`;

    if (explodedBombs.has(bombKey)) {
        continue;
    }

    const bombBlock = getBlockAt(currentBomb.row, currentBomb.col);

    if (!bombBlock || !bombBlock.active || !bombBlock.isBomb) {
        continue;
    }

    explodedBombs.add(bombKey);
    bombBlock.active = false;
    addExplosion(currentBomb.row, currentBomb.col, '#ffffff', 2.1);

    for (let row = currentBomb.row - 1; row <= currentBomb.row + 1; row++) {
        for (let col = currentBomb.col - 1; col <= currentBomb.col + 1; col++) {
        const block = getBlockAt(row, col);

        if (!block || !block.active) {
            continue;
        }

        if (block.isBomb) {
            bombsToExplode.push({ row: row, col: col });
            continue;
        }

        pointsEarned += destroyBlock(row, col);
        }
    }
    }

    return pointsEarned;
}


function activateFreeze(row, col) {
    const now = performance.now();
    const remainingFreezeTime = Math.max(0, freezeUntilTime - now);
    freezeUntilTime = now + remainingFreezeTime + FREEZE_DURATION;
    freezePauseStartedAt = 0;
    
    addExplosion(row, col, '#93c5fd', 1.4);
}

function reflectBallFromBlock(x, y) {
    const previousBallRight = ball.prevX + ball.radius;
    const previousBallLeft = ball.prevX - ball.radius;
    const previousBallBottom = ball.prevY + ball.radius;
    const previousBallTop = ball.prevY - ball.radius;

    const blockLeft = x;
    const blockRight = x + BLOCK_WIDTH;
    const blockTop = y;
    const blockBottom = y + BLOCK_HEIGHT;

    const cameFromLeft = previousBallRight <= blockLeft;
    const cameFromRight = previousBallLeft >= blockRight;
    const cameFromTop = previousBallBottom <= blockTop;
    const cameFromBottom = previousBallTop >= blockBottom;

    if (cameFromLeft || cameFromRight) {
    ball.dx = -ball.dx;
    return;
    }

    if (cameFromTop || cameFromBottom) {
    ball.dy = -ball.dy;
    return;
    }

    const overlapLeft = ball.x + ball.radius - blockLeft;
    const overlapRight = blockRight - (ball.x - ball.radius);
    const overlapTop = ball.y + ball.radius - blockTop;
    const overlapBottom = blockBottom - (ball.y - ball.radius);

    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);

    if (minOverlapX < minOverlapY) {
    ball.dx = -ball.dx;
    } else {
    ball.dy = -ball.dy;
    }
}

function collideWithSingleBlock(row, col, block, y) {
    if (!block.active) {
    return false;
    }

    if (y + BLOCK_HEIGHT <= 0) {
    return false;
    }

    const x = BLOCK_GAP + col * (BLOCK_WIDTH + BLOCK_GAP);

    const hitX = ball.x + ball.radius >= x && ball.x - ball.radius <= x + BLOCK_WIDTH;
    const hitY = ball.y + ball.radius >= y && ball.y - ball.radius <= y + BLOCK_HEIGHT;

    if (!hitX || !hitY) {
    return false;
    }

    let pointsEarned = 0;

    if (block.isBomb) {
    pointsEarned = explodeBomb(row, col);
    } else if (block.isFreeze) {
    pointsEarned = destroyBlock(row, col);
    activateFreeze(row, col);
    } else {
    pointsEarned = destroyBlock(row, col);
    addExplosion(row, col, block.color, 0.8);
    }

    reflectBallFromBlock(x, y);
    score += pointsEarned;
    scoreElement.textContent = score;

    if (score > highScore) {
    highScore = score;
    highScoreElement.textContent = highScore;
    saveHighScore(highScore);
    }

    updateLevelAndSpeed();
    checkWinCondition();
    refillBlocksIfEmpty();
    checkClearedRows();
    return true;
}

function collideWithBlocks() {
    if (pendingTopRow) {
    const pendingY = getPendingRowY();

    for (let col = 0; col < GRID_COLUMNS; col++) {
        const block = pendingTopRow[col];

        if (collideWithSingleBlock(-1, col, block, pendingY)) {
        return;
        }
    }
    }

    for (let row = 0; row < blocks.length; row++) {
    const y = getBlockY(row);

    for (let col = 0; col < GRID_COLUMNS; col++) {
        const block = blocks[row][col];

        if (collideWithSingleBlock(row, col, block, y)) {
        return;
        }
    }
    }
}

function updatePaddleByKeyboard(deltaScale) {
    if (keys.left) {
    paddle.x -= KEYBOARD_PADDLE_SPEED * deltaScale;
    }

    if (keys.right) {
    paddle.x += KEYBOARD_PADDLE_SPEED * deltaScale;
    }

    paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, paddle.x));
}

function checkBlocksReachedPaddle() {
    for (let row = 0; row < blocks.length; row++) {
    for (let col = 0; col < GRID_COLUMNS; col++) {
        const block = blocks[row][col];

        if (!block.active) {
        continue;
        }

        const y = getBlockY(row);

        if (y + BLOCK_HEIGHT >= paddle.y) {
        gameOver = true;
        
        return;
        }
    }
    }
}

function updateTimedRows() {
    const now = performance.now();

    if (now < freezeUntilTime) {
    if (freezePauseStartedAt === 0) {
        freezePauseStartedAt = now;
    }
    return;
    }

    if (freezePauseStartedAt !== 0) {
    lastNewRowTime += now - freezePauseStartedAt;
    freezePauseStartedAt = 0;
    
    }

    const levelSpeedMultiplier = Math.pow(BLOCK_SPEED_GROWTH, level - 1);
    const adjustedInterval = NEW_ROW_INTERVAL / levelSpeedMultiplier;

    const elapsed = now - lastNewRowTime;
    const progress = Math.min(elapsed / adjustedInterval, 1);
    rowDropOffset = progress * (BLOCK_HEIGHT + BLOCK_GAP);
    checkBlocksReachedPaddle();
    if (progress >= 1) {
    addNewTopRow();
    checkBlocksReachedPaddle();
    lastNewRowTime = now;
    }
}

function updateBallPhysics(deltaSeconds) {
    ball.prevX = ball.x;
    ball.prevY = ball.y;

    ball.x += ball.dx * deltaSeconds;
    ball.y += ball.dy * deltaSeconds;

    collideWithWalls();
    collideWithPaddle();
    collideWithBlocks();

    ballTrail.unshift({ x: ball.x, y: ball.y });

    if (ballTrail.length > BALL_TRAIL_LENGTH) {
        ballTrail.pop();
    }
}

function update(deltaSeconds) {
    if (!gameStarted || gameOver || isPaused) {
        if (gameOver && freezeStoppedAt === 0) {
            freezeStoppedAt = performance.now();
        }
        return;
    }

    if (gameWon) {
        if (freezeStoppedAt === 0) {
            freezeStoppedAt = performance.now();
        }

        winAnimationTime += deltaSeconds;
        updateWinExplosions();
        updateExplosions(deltaSeconds * 60);
        return;
    }

    runElapsedTime += deltaSeconds * 1000;
    shineTime += deltaSeconds;

    updatePaddleByKeyboard(deltaSeconds * 60);
    updateTimedRows();
    updateExplosions(deltaSeconds * 60);

    const maxStepSeconds = 1 / 120;
    const steps = Math.max(1, Math.ceil(deltaSeconds / maxStepSeconds));
    const stepSeconds = deltaSeconds / steps;

    for (let step = 0; step < steps; step++) {
        updateBallPhysics(stepSeconds);

        if (gameOver || gameWon) {
            break;
        }
    }
}

function drawFPS() {
    ctx.save();

    ctx.fillStyle = 'rgb(0, 255, 0)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';

    ctx.fillText(`FPS: ${fps}`, WIDTH -10, HEIGHT - 15);

    ctx.restore();
}

function drawWinProgress() {
    const requiredScore = getScoreRequiredToCompleteGame();
    const progress = Math.max(0, Math.min(1, score / requiredScore));

    const barX = 0;
    const barY = 0;
    const barWidth = WIDTH;
    const barHeight = 10;

    const colorStops = [
        [0,    [0, 0, 255]],     // blue
        [0.25, [0, 255, 0]],     // green
        [0.5,  [255, 255, 0]],   // yellow
        [0.75, [255, 127, 0]],   // orange
        [0.95, [255, 0, 0]]      // red almost at the end
    ];

    let fillColor = 'rgb(0,0,255)';

    for (let i = 0; i < colorStops.length - 1; i++) {
        const [p1, c1] = colorStops[i];
        const [p2, c2] = colorStops[i + 1];

        if (progress >= p1 && progress <= p2) {
            const t = (progress - p1) / (p2 - p1);
            fillColor = interpolateColor(c1, c2, t);
            break;
        }

        if (progress > 0.95) {
            fillColor = 'rgb(255,0,0)';
        }
    }

    const stripeWidth = 16;
    const offset = (shineTime * 20) % stripeWidth;

    ctx.save();

    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.beginPath();
    ctx.rect(barX, barY, barWidth, barHeight);
    ctx.clip();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 4;

    for (let x = -barHeight - stripeWidth; x < barWidth + stripeWidth; x += stripeWidth) {
        ctx.beginPath();
        ctx.moveTo(x + offset, barY + barHeight);
        ctx.lineTo(x + offset + barHeight, barY);
        ctx.stroke();
    }

    ctx.restore();

    ctx.save();

    ctx.beginPath();
    ctx.rect(barX, barY, barWidth * progress, barHeight);
    ctx.clip();

    ctx.fillStyle = fillColor;
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 4;

    for (let x = -barHeight - stripeWidth; x < barWidth + stripeWidth; x += stripeWidth) {
        ctx.beginPath();
        ctx.moveTo(x + offset, barY + barHeight);
        ctx.lineTo(x + offset + barHeight, barY);
        ctx.stroke();
    }

    ctx.restore();

    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(barX + 1, barY + 1, barWidth - 2, barHeight - 2);
    ctx.restore();
}

function lerpColor(a, b, t) {
    return Math.round(a + (b - a) * t);
}

function interpolateColor(c1, c2, t) {
    return `rgb(${lerpColor(c1[0], c2[0], t)}, ${lerpColor(c1[1], c2[1], t)}, ${lerpColor(c1[2], c2[2], t)})`;
}

function drawStartButton() {
    if (gameStarted && !gameOver && !gameWon) {
        return;
    }

    ctx.save();

    const x = startButton.x;
    const y = startButton.y;

    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(x, y, startButton.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `${16 * UI_SCALE}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let label = 'START';

    if (gameOver) {
        label = 'RESTART';
    }

    if (gameWon) {
        label = 'RESTART';
    }

    ctx.fillText(label, x, y);

    ctx.restore();
}

function drawSaveButton() {
    if (!gameStarted || gameOver || gameWon || isPaused) {
        return;
    }

    const canSave = score >= SAVE_COST;

    ctx.save();

    ctx.globalAlpha = canSave ? 0.82 : 0.32;
    ctx.fillStyle = '#000000';
    ctx.fillRect(
        saveButton.x - saveButton.width / 2,
        saveButton.y - saveButton.height / 2,
        saveButton.width,
        saveButton.height
    );

    ctx.globalAlpha = canSave ? 1 : 0.45;
    ctx.strokeStyle = canSave ? '#ffffff' : '#9ca3af';
    ctx.lineWidth = 1;
    ctx.strokeRect(
        saveButton.x - saveButton.width / 2,
        saveButton.y - saveButton.height / 2,
        saveButton.width,
        saveButton.height
    );

    ctx.fillStyle = canSave ? '#ffffff' : '#9ca3af';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SALVATION', saveButton.x, saveButton.y);

    ctx.restore();
}

function drawPauseOverlay() {
    if (!isPaused || gameOver || gameWon) {
        return;
    }

    ctx.save();

    // dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // button
    const x = startButton.x;
    const y = startButton.y;

    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(x, y, startButton.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `${16 * UI_SCALE}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RESUME', x, y);

    ctx.restore();
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    drawPendingTopRow();
    drawBlocks();
    drawExplosions();
    drawSafeZone();
    drawDangerLine();
    drawPaddle();
    drawSaveButton();
    drawBall();
    drawFreezeTimer();
    drawFPS();
    drawWinProgress();
    drawRunTimer();
    drawPauseOverlay();

    if (gameOver) {
    drawGameOver();
    }

    if (gameWon) {
    drawWin();
    }

    drawStartButton();
}

function loop(timestamp) {
    const deltaTime = timestamp - lastFrameTime;
    const deltaSeconds = Math.min(deltaTime / 1000, 0.033);
    lastFrameTime = timestamp;

    fpsCounter++;
    fpsTime += deltaTime;

    if (fpsTime >= 1000) {
        fps = fpsCounter;
        fpsCounter = 0;
        fpsTime = 0;
    }

    update(deltaSeconds);
    draw();
    requestAnimationFrame(loop);
}

restartGame();
requestAnimationFrame(loop);
