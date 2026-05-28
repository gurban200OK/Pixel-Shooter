### [Current Date] - Game freezes and player unable to move after restarting

**What I asked the AI:** 
I asked the AI to write a function to restart the game without reloading the page.

**What it gave me:** 
It provided the `initGame` function to reset all variables and clear arrays, but it omitted resetting the `gameActive` state variable.

**What was wrong:** 
When the player died, `gameActive` was set to `false` inside the game over logic to prevent movement and input. However, when clicking the restart button, `gameActive` was never set back to `true` inside `initGame()`. As a result, the game loop and event listeners ignored all inputs, causing the player and enemies to freeze in place upon revival.

**How I fixed it:** 
I manually added `gameActive = true;` inside the `initGame()` function to restore input controls and ensure the game loop updates properly.

**Time lost:** ~5 minutes