// Storefront shortcuts for the category strip and the "shop by" cards.
// Each shortcut sets the same dropdown a student would set by hand and then
// calls app.js's own function, so the results are identical to using the
// regular controls. Load after app.js.
(function () {
    const ANALYTICS = [
        'getTopProducts',
        'getCustomerSegments',
        'getRevenueByCategory',
        'getOrderStatus',
        'getMonthlySales',
        'getProductPerformance'
    ];

    const setValue = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
    };

    document.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-category], [data-price], [data-analytics]');
        if (!trigger) return;

        if ('category' in trigger.dataset) {
            setValue('category-filter', trigger.dataset.category);
            setValue('price-filter', '');
            filterByCategory();
        } else if ('price' in trigger.dataset) {
            setValue('price-filter', trigger.dataset.price);
            setValue('category-filter', '');
            filterByPrice();
        } else if (ANALYTICS.includes(trigger.dataset.analytics)) {
            window[trigger.dataset.analytics]();
        }
    });
})();
