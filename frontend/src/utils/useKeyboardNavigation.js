import { useEffect } from 'react';

/**
 * Custom hook to enable arrow key and enter key navigation between input boxes across all pages.
 * - ArrowDown / Enter: Moves focus to input in column below or next input field.
 * - ArrowUp: Moves focus to input in column above or previous input field.
 * - ArrowRight: Moves focus to next input field (when cursor is at end or text selected).
 * - ArrowLeft: Moves focus to previous input field (when cursor is at start or text selected).
 */
export const useKeyboardNavigation = () => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      if (!target || !target.tagName) return;

      const tag = target.tagName.toUpperCase();
      const isInputOrSelect = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
      if (!isInputOrSelect) return;

      const key = e.key;
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(key)) {
        return;
      }

      const inputType = target.type ? target.type.toLowerCase() : '';

      // Skip navigation in textarea when pressing Enter (to allow new lines) or arrow keys inside multiline text
      if (tag === 'TEXTAREA') {
        if (key === 'Enter') return;
        const val = target.value || '';
        const selStart = target.selectionStart;
        const selEnd = target.selectionEnd;
        if (key === 'ArrowUp' && selStart > 0) return;
        if (key === 'ArrowDown' && selEnd < val.length) return;
        if (key === 'ArrowLeft' && selStart > 0) return;
        if (key === 'ArrowRight' && selEnd < val.length) return;
      }

      // Allow native horizontal cursor movement inside text inputs if cursor is not at boundary
      if ((key === 'ArrowLeft' || key === 'ArrowRight') && tag === 'INPUT') {
        const textTypes = ['text', 'search', 'number', 'tel', 'url', 'email', 'password'];
        if (textTypes.includes(inputType)) {
          try {
            const selStart = target.selectionStart;
            const selEnd = target.selectionEnd;
            const valLen = target.value ? target.value.length : 0;
            // If user has highlighted text or cursor is in middle of text, let browser move caret
            if (key === 'ArrowLeft' && selStart !== 0) return;
            if (key === 'ArrowRight' && selEnd !== valLen && selStart !== selEnd) return;
            if (key === 'ArrowRight' && selEnd !== valLen) return;
          } catch (err) {
            // Browsers may throw on selectionStart for some input types like date
          }
        }
      }

      // Query all visible and focusable input, select, and textarea elements
      const selector = 'input:not([type="hidden"]):not([disabled]):not([readonly]), select:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])';
      const allInputs = Array.from(document.querySelectorAll(selector)).filter((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0 && el.offsetHeight > 0;
      });

      if (allInputs.length <= 1) return;

      const currentIndex = allInputs.indexOf(target);
      if (currentIndex === -1) return;

      const currentRect = target.getBoundingClientRect();
      const currentCenterX = currentRect.left + currentRect.width / 2;
      const currentCenterY = currentRect.top + currentRect.height / 2;

      let nextEl = null;

      if (key === 'Enter') {
        e.preventDefault();
        nextEl = allInputs[(currentIndex + 1) % allInputs.length];
      } else if (key === 'ArrowDown') {
        e.preventDefault();
        // Find inputs strictly below current row
        const candidates = allInputs
          .map((el) => {
            const rect = el.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            const centerX = rect.left + rect.width / 2;
            const dy = centerY - currentCenterY;
            const dx = centerX - currentCenterX;
            return { el, dy, dx };
          })
          .filter((c) => c.dy > 5);

        if (candidates.length > 0) {
          candidates.sort((a, b) => {
            const yDiff = a.dy - b.dy;
            if (Math.abs(yDiff) > 15) return yDiff; // Pick upper row below
            return Math.abs(a.dx) - Math.abs(b.dx); // Pick closest column X
          });
          nextEl = candidates[0].el;
        } else {
          nextEl = allInputs[currentIndex + 1] || allInputs[0];
        }
      } else if (key === 'ArrowUp') {
        e.preventDefault();
        // Find inputs strictly above current row
        const candidates = allInputs
          .map((el) => {
            const rect = el.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            const centerX = rect.left + rect.width / 2;
            const dy = currentCenterY - centerY;
            const dx = centerX - currentCenterX;
            return { el, dy, dx };
          })
          .filter((c) => c.dy > 5);

        if (candidates.length > 0) {
          candidates.sort((a, b) => {
            const yDiff = a.dy - b.dy;
            if (Math.abs(yDiff) > 15) return yDiff; // Pick row closest above
            return Math.abs(a.dx) - Math.abs(b.dx); // Pick closest column X
          });
          nextEl = candidates[0].el;
        } else {
          nextEl = allInputs[currentIndex - 1] || allInputs[allInputs.length - 1];
        }
      } else if (key === 'ArrowRight') {
        e.preventDefault();
        nextEl = allInputs[currentIndex + 1] || allInputs[0];
      } else if (key === 'ArrowLeft') {
        e.preventDefault();
        nextEl = allInputs[currentIndex - 1] || allInputs[allInputs.length - 1];
      }

      if (nextEl) {
        nextEl.focus();
        if (nextEl.tagName === 'INPUT' && typeof nextEl.select === 'function') {
          setTimeout(() => {
            try {
              nextEl.select();
            } catch (err) {}
          }, 0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);
};
