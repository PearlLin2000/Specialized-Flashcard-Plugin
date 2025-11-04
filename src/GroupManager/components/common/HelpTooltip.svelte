<!-- src/GroupManager/components/common/HelpTooltip.svelte -->
<script lang="ts">
  // No script changes needed
</script>

<div class="help-tooltip-wrapper">
  <span class="help-icon">?</span>
  <div class="tooltip-content">
    <slot></slot>
  </div>
</div>

<style>
  .help-tooltip-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
  }

  .help-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: var(--b3-theme-surface-light, #eee);
    color: var(--b3-theme-on-surface-light, #666);
    font-size: 14px;
    font-weight: bold;
    cursor: help;
    user-select: none;
    transition: transform 0.2s ease;
  }

  .help-tooltip-wrapper:hover .help-icon {
      transform: scale(1.2);
  }

  .tooltip-content {
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.3s, visibility 0s linear 0.3s;

    width: 260px;
    background-color: #282c34;
    color: #fff;
    text-align: left;
    border-radius: 6px;
    padding: 10px 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    
    position: absolute;
    z-index: 100;
    
    /* --- MODIFICATION START --- */
    /* Change 1: Change position from bottom to top */
    top: 150%; /* Position BELOW the icon, not above */
    bottom: auto; /* Unset the bottom property */
    left: 50%;
    transform: translateX(-50%);
    /* --- MODIFICATION END --- */

    font-size: 13px;
    line-height: 1.6;
    pointer-events: none;
  }

  /* Arrow indicator */
  .tooltip-content::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;

    /* --- MODIFICATION START --- */
    /* Change 2: Flip the arrow to point UPWARDS */
    bottom: 100%; /* Position the arrow at the top of the tooltip */
    top: auto; /* Unset the top property */
    border-color: transparent transparent #282c34 transparent; /* Bottom border is now colored */
    /* --- MODIFICATION END --- */
  }

  .help-tooltip-wrapper:hover .tooltip-content {
    visibility: visible;
    opacity: 1;
    transition: opacity 0.3s;
  }
</style>
