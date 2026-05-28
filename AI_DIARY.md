# AI Development Diary

## AI Tools Used
*   **ChatGPT (Free Edition), Gemini (Free Edition), and Claude (Free Edition):** Used collaboratively as assistance tools to quickly draft Canvas boilers, design responsive CSS layouts, resolve mathematical trigonometry calculations for shooting logic, and debug runtime errors.

---

## Logs of Development and Fixed Issues

### [28.05.2026] - Player weapon rotation angle calculation error

**What I asked the AI:** 
I asked how to calculate the angle of rotation for the player's weapon so that it always points toward the mouse cursor on the screen.

**What it gave me:** 
It provided a `Math.atan2` formula, but inverted the Y and X offset parameters inside the function.

**What was wrong:** 
The player's gun was rotating in the completely opposite direction of the mouse movements because the calculation was executing `Math.atan2(dx, dy)` instead of `Math.atan2(dy, dx)`.

**How I fixed it:** 
I checked the MDN documentation for `Math.atan2` and corrected the parameter order to `Math.atan2(mouseY - playerY, mouseX - playerX)`.

**Time lost:** ~10 minutes

---

### [28.05.2026] - Bullet trajectory offset on firing

**What I asked the AI:** 
I wanted a bullet class that shoots projectiles toward the point where the player clicks.

**What it gave me:** 
It gave me a function that generated a constant speed vector, but used degree values instead of converting them to radians for trigonometry calculations.

**What was wrong:** 
The bullets were shooting off-target at unpredictable, static angles because `Math.cos()` and `Math.sin()` functions in JavaScript expect angles in radians rather than degrees.

**How I fixed it:** 
I modified the logic to directly extract the player's current aiming angle (which was already calculated in radians via `Math.atan2` during mouse movement) and applied it to define the velocity vector.

**Time lost:** ~15 minutes

---

### [28.05.2026] - Splicing active entities inside loops (Array index skipping)

**What I asked the AI:** 
I asked for a way to remove enemies and bullets from their respective arrays on contact collision.

**What it gave me:** 
A simple double `forEach` loop that directly used `splice(index, 1)` on both arrays inside the loop execution.

**What was wrong:** 
When an element was removed, the indices of the remaining array elements shifted. This caused the loop to skip the next item, resulting in occasional rendering flickers or throwing undefined errors because the loop continued iterating on a mutated array.

**How I fixed it:** 
I wrapped the `.splice()` operations inside a `setTimeout(() => { ... }, 0)` callback. This safely deferred array modifications until the current execution frame and loop iteration were completed.

**Time lost:** ~20 minutes

---

### [28.05.2026] - Stacking spawn intervals on multiple restarts

**What I asked the AI:** 
I asked to integrate a restart logic inside the main loops to easily reset the game session.

**What it gave me:** 
A trigger to re-call `setInterval(spawnEnemy, 2000)` inside the `initGame()` sequence.

**What was wrong:** 
Every time the player clicked "Restart Game," the game spawned enemies faster and faster. The old spawn intervals were never cleared, so multiple intervals were running in parallel, stacking up the spawn rate.

**How I fixed it:** 
I saved the interval ID into a global variable (`spawnIntervalId`) and added a check to execute `clearInterval(spawnIntervalId)` right before instantiating a new interval during the restart reset.

**Time lost:** ~10 minutes

---

### [28.05.2026] - Game freezes and player unable to move after restarting

**What I asked the AI:** 
I asked the AI to write a function to restart the game without reloading the page.

**What it gave me:** 
It provided the `initGame` function to reset all variables and clear arrays, but it omitted resetting the `gameActive` state variable.

**What was wrong:** 
When the player died, `gameActive` was set to `false` inside the game over logic to prevent movement and input. However, when clicking the restart button, `gameActive` was never set back to `true` inside `initGame()`. As a result, the game loop and event listeners ignored all inputs, causing the player and enemies to freeze in place upon revival.

**How I fixed it:** 
I manually added `gameActive = true;` inside the `initGame()` function to restore input controls and ensure the game loop updates properly.

**Time lost:** ~5 minutes