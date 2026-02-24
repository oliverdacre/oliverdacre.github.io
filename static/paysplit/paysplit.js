// Store categories with name, percentage, and color
let categories = [];
let isDragging = false;
let dragDivider = null;
let percentageBar = null;
let categoriesContainer = null;

// Color palette for categories
const colors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4', '#FF5722', '#795548', '#607D8B', '#FFC107'];
let colorIndex = 0;

// Load saved values from localStorage
function loadSavedValues() {
    const savedCategories = localStorage.getItem('paysplit_categories');
    const savedAmount = localStorage.getItem('paysplit_amount');
    
    if (savedCategories) {
        try {
            categories = JSON.parse(savedCategories);
        } catch (e) {
            console.error('Error loading saved categories:', e);
            // Initialize with default categories if load fails
            initializeDefaultCategories();
        }
    } else {
        // Initialize with default categories
        initializeDefaultCategories();
    }
    
    if (savedAmount) {
        document.getElementById('totalAmount').value = savedAmount;
    }
}

// Initialize default categories on first load
function initializeDefaultCategories() {
    categories = [
        { name: 'Savings', percentage: 50, color: colors[0] },
        { name: 'Spending', percentage: 50, color: colors[1] }
    ];
    colorIndex = 2;
}

// Save values to localStorage
function saveValues() {
    localStorage.setItem('paysplit_categories', JSON.stringify(categories));
    localStorage.setItem('paysplit_amount', document.getElementById('totalAmount').value);
}

// Initialize the draggable bar
function initSliders() {
    percentageBar = document.getElementById('percentageBar');
    categoriesContainer = document.getElementById('categoriesContainer');
    
    // Load saved values first
    loadSavedValues();
    
    // Listen to total amount changes with validation
    const totalInput = document.getElementById('totalAmount');
    totalInput.addEventListener('input', () => {
        // Validate input
        let value = parseFloat(totalInput.value);
        if (value < 0) {
            totalInput.value = 0;
        } else if (value > 999999999) {
            totalInput.value = 999999999;
        }
        updateDisplay();
        saveValues();
    });
    
    // Add category button
    document.getElementById('addCategoryBtn').addEventListener('click', addCategory);
    
    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetToDefaults);
    }
    
    // Mouse and touch events for dragging
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', stopDrag);
    
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboard);
    
    renderCategories();
    updateDisplay();
}

// Reset to defaults
function resetToDefaults() {
    if (!confirm('Reset to default categories? This will clear all your custom categories and settings.')) {
        return;
    }
    
    localStorage.removeItem('paysplit_categories');
    localStorage.removeItem('paysplit_amount');
    
    initializeDefaultCategories();
    document.getElementById('totalAmount').value = 1000;
    
    renderCategories();
    updateDisplay();
    saveValues();
}

// Add a new category
function addCategory() {
    // Limit to 10 categories for usability
    if (categories.length >= 10) {
        alert('Maximum 10 categories allowed for better usability.');
        return;
    }
    
    const color = colors[colorIndex % colors.length];
    colorIndex++;
    
    if (categories.length === 0) {
        // First category gets 100%
        categories.push({
            name: `Category 1`,
            percentage: 100,
            color: color
        });
    } else {
        // Find a category with the highest percentage to take from
        let maxIndex = 0;
        let maxPercentage = categories[0].percentage;
        for (let i = 1; i < categories.length; i++) {
            if (categories[i].percentage > maxPercentage) {
                maxPercentage = categories[i].percentage;
                maxIndex = i;
            }
        }
        
        // Take half from the largest category, minimum 1%
        const takeAmount = Math.max(1, Math.floor(categories[maxIndex].percentage / 2));
        categories[maxIndex].percentage -= takeAmount;
        
        categories.push({
            name: `Category ${categories.length + 1}`,
            percentage: takeAmount,
            color: color
        });
    }
    
    renderCategories();
    updateDisplay();
    saveValues();
}

// Delete a category
function deleteCategory(index) {
    if (categories.length <= 1) {
        alert('You must have at least one category!');
        return;
    }
    
    // Confirmation dialog
    if (!confirm(`Delete "${categories[index].name}"? Its percentage will be redistributed to other categories.`)) {
        return;
    }
    
    const deletedPercentage = categories[index].percentage;
    categories.splice(index, 1);
    
    // Redistribute the deleted percentage equally among remaining categories
    if (categories.length > 0 && deletedPercentage > 0) {
        const addToEach = Math.floor(deletedPercentage / categories.length);
        let remainder = deletedPercentage % categories.length;
        
        categories.forEach((cat, i) => {
            cat.percentage += addToEach;
            if (i < remainder) {
                cat.percentage += 1;
            }
        });
    }
    
    renderCategories();
    updateDisplay();
    saveValues();
}

// Update category name
function updateCategoryName(index, newName) {
    categories[index].name = newName;
    saveValues();
}

// Render all categories
function renderCategories() {
    // Clear existing
    categoriesContainer.innerHTML = '';
    percentageBar.innerHTML = '';
    
    // Create bar segments
    categories.forEach((cat, index) => {
        const segment = document.createElement('div');
        segment.className = 'bar-segment';
        segment.id = `bar${index}`;
        segment.style.backgroundColor = cat.color;
        segment.style.width = `${cat.percentage}%`;
        // Set z-index so leftmost segments appear on top when stacked at 0%
        segment.style.zIndex = categories.length - index;
        
        // Show name and percentage if there's enough space (>10%)
        if (cat.percentage > 10) {
            segment.innerHTML = `<span class="segment-name">${cat.name}</span><span class="segment-percentage">${cat.percentage}%</span>`;
        } else if (cat.percentage > 0) {
            segment.innerHTML = `<span class="segment-percentage">${cat.percentage}%</span>`;
        }
        
        percentageBar.appendChild(segment);
    });
    
    // Create dividers
    for (let i = 0; i < categories.length - 1; i++) {
        const divider = document.createElement('div');
        divider.className = 'bar-divider';
        divider.dataset.divider = i;
        divider.tabIndex = 0;
        // Set higher z-index for leftmost dividers so they appear on top when stacked
        divider.style.zIndex = 100 + (categories.length - i);
        divider.setAttribute('role', 'slider');
        divider.setAttribute('aria-label', `Adjust split between ${categories[i].name} and ${categories[i + 1].name}`);
        divider.setAttribute('aria-valuenow', categories[i].percentage);
        divider.setAttribute('aria-valuemin', '0');
        divider.setAttribute('aria-valuemax', '100');
        divider.addEventListener('mousedown', startDrag);
        divider.addEventListener('touchstart', startDrag, { passive: false });
        percentageBar.appendChild(divider);
    }
    
    // Create category list
    categories.forEach((cat, index) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category';
        
        categoryDiv.innerHTML = `
            <div class="category-info">
                <div class="category-color" style="background-color: ${cat.color};"></div>
                <input type="text" class="category-name-input" value="${cat.name}" data-index="${index}">
            </div>
            <div class="category-stats">
                <span class="percentage" id="percentage${index}" style="color: ${cat.color};">${cat.percentage}%</span>
                <div class="amount" id="amount${index}" style="color: ${cat.color};">$0.00</div>
                <button class="delete-btn" data-index="${index}">Delete</button>
            </div>
        `;
        
        categoriesContainer.appendChild(categoryDiv);
        
        // Add event listeners
        const nameInput = categoryDiv.querySelector('.category-name-input');
        nameInput.addEventListener('change', (e) => {
            updateCategoryName(index, e.target.value);
        });
        
        const deleteBtn = categoryDiv.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteCategory(index));
    });
    
    updateDividerPositions();
}

// Create draggable dividers between bar segments
function createDividers() {
    // Dividers are now created in renderCategories
}

// Start dragging a divider
function startDrag(e) {
    isDragging = true;
    dragDivider = parseInt(e.currentTarget.dataset.divider);
    e.preventDefault();
}

// Handle dragging
function drag(e) {
    if (!isDragging || dragDivider === null || categories.length < 2) return;
    
    // Prevent scrolling on touch devices
    if (e.type === 'touchmove') {
        e.preventDefault();
    }
    
    const rect = percentageBar.getBoundingClientRect();
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const mouseX = clientX - rect.left;
    const barWidth = rect.width;
    const mousePercent = Math.max(0, Math.min(100, (mouseX / barWidth) * 100));
    
    // The divider affects the segment to its left and right
    const leftSegmentIndex = dragDivider;
    const rightSegmentIndex = dragDivider + 1;
    
    if (rightSegmentIndex >= categories.length) return;
    
    // Calculate cumulative percentage before the left segment
    let cumulativeBefore = 0;
    for (let i = 0; i < leftSegmentIndex; i++) {
        cumulativeBefore += categories[i].percentage;
    }
    
    // Total of the two segments affected by this divider
    const totalOfPair = categories[leftSegmentIndex].percentage + categories[rightSegmentIndex].percentage;
    
    // If both segments are 0%, we need to borrow from other categories
    if (totalOfPair === 0) {
        // Find the nearest non-zero category to borrow from
        let borrowIndex = -1;
        let borrowAmount = 0;
        
        // Look left first
        for (let i = leftSegmentIndex - 1; i >= 0; i--) {
            if (categories[i].percentage > 0) {
                borrowIndex = i;
                borrowAmount = Math.min(10, categories[i].percentage);
                break;
            }
        }
        
        // If not found, look right
        if (borrowIndex === -1) {
            for (let i = rightSegmentIndex + 1; i < categories.length; i++) {
                if (categories[i].percentage > 0) {
                    borrowIndex = i;
                    borrowAmount = Math.min(10, categories[i].percentage);
                    break;
                }
            }
        }
        
        // If we found a category to borrow from, redistribute
        if (borrowIndex !== -1 && borrowAmount > 0) {
            categories[borrowIndex].percentage -= borrowAmount;
            categories[leftSegmentIndex].percentage = Math.floor(borrowAmount / 2);
            categories[rightSegmentIndex].percentage = borrowAmount - categories[leftSegmentIndex].percentage;
        } else {
            // Can't drag if all categories are 0%
            return;
        }
        
        updateDisplay();
        return;
    }
    
    // Calculate cumulative after the right segment
    const cumulativeAfter = cumulativeBefore + totalOfPair;
    
    // Ensure mouse is within bounds of these two segments
    const constrainedPercent = Math.max(cumulativeBefore + 0.5, Math.min(cumulativeAfter - 0.5, mousePercent));
    
    // Calculate new values for left and right segments
    const newLeftValue = Math.round(constrainedPercent - cumulativeBefore);
    const newRightValue = totalOfPair - newLeftValue;
    
    // Update values ensuring they're non-negative
    categories[leftSegmentIndex].percentage = Math.max(0, Math.min(totalOfPair, newLeftValue));
    categories[rightSegmentIndex].percentage = Math.max(0, totalOfPair - categories[leftSegmentIndex].percentage);
    
    updateDisplay();
}

// Stop dragging
function stopDrag() {
    if (isDragging) {
        saveValues();
    }
    isDragging = false;
    dragDivider = null;
}

// Handle keyboard navigation
function handleKeyboard(e) {
    const target = e.target;
    if (!target.classList.contains('bar-divider')) return;
    
    const dividerIndex = parseInt(target.dataset.divider);
    const leftIndex = dividerIndex;
    const rightIndex = dividerIndex + 1;
    
    if (rightIndex >= categories.length) return;
    
    let change = 0;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        change = -1;
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        change = 1;
    } else {
        return;
    }
    
    e.preventDefault();
    
    // Shift key for larger increments
    if (e.shiftKey) {
        change *= 5;
    }
    
    // Adjust percentages
    const totalOfPair = categories[leftIndex].percentage + categories[rightIndex].percentage;
    const newLeftValue = Math.max(0, Math.min(totalOfPair, categories[leftIndex].percentage + change));
    
    categories[leftIndex].percentage = newLeftValue;
    categories[rightIndex].percentage = totalOfPair - newLeftValue;
    
    updateDisplay();
    saveValues();
}

// Update divider positions
function updateDividerPositions() {
    let cumulative = 0;
    for (let i = 0; i < categories.length - 1; i++) {
        cumulative += categories[i].percentage;
        const divider = document.querySelector(`[data-divider="${i}"]`);
        if (divider) {
            divider.style.left = `${cumulative}%`;
            // Update z-index so leftmost dividers are always on top when stacked
            divider.style.zIndex = 100 + (categories.length - i);
        }
    }
}

// Update the display (AJAX-style without page reload)
function updateDisplay() {
    const totalAmount = parseFloat(document.getElementById('totalAmount').value) || 0;
    let total = 0;
    
    categories.forEach((cat, index) => {
        total += cat.percentage;
        const percentage = cat.percentage;
        const amount = (totalAmount * percentage) / 100;
        
        const percentageEl = document.getElementById(`percentage${index}`);
        const amountEl = document.getElementById(`amount${index}`);
        
        if (percentageEl) percentageEl.textContent = `${percentage}%`;
        if (amountEl) amountEl.textContent = `$${amount.toFixed(2)}`;
        
        // Update bar segment width and text
        const barSegment = document.getElementById(`bar${index}`);
        if (barSegment) {
            barSegment.style.width = `${percentage}%`;
            // Set z-index so leftmost segments appear on top when stacked at 0%
            barSegment.style.zIndex = categories.length - index;
            
            // Show name and percentage if there's enough space (>10%)
            if (percentage > 10) {
                barSegment.innerHTML = `<span class="segment-name">${cat.name}</span><span class="segment-percentage">${percentage}%</span>`;
            } else if (percentage > 0) {
                barSegment.innerHTML = `<span class="segment-percentage">${percentage}%</span>`;
            } else {
                barSegment.innerHTML = '';
            }
        }
    });
    
    // Show warning if percentages don't equal 100%
    const warningEl = document.getElementById('percentageWarning');
    if (warningEl) {
        if (total !== 100) {
            warningEl.style.display = 'block';
            warningEl.textContent = `⚠️ Percentages total ${total}% (should be 100%)`;
        } else {
            warningEl.style.display = 'none';
        }
    }
    
    // Update divider positions
    updateDividerPositions();
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSliders);
} else {
    initSliders();
}