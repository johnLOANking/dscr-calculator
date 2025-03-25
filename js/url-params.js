/**
 * URL Parameters Handler for DSCR Calculator
 * Handles loading calculator values from URL parameters
 */

// Extend the Alpine.js component with URL parameter handling
console.log("URL params.js loaded");

document.addEventListener('alpine:init', () => {
    console.log("Extending Alpine with URL parameter handling");
    Alpine.data('dscrCalculator', () => ({
        /**
         * Apply URL parameters to calculator fields
         */
        applyUrlParams() {
            const urlParams = new URLSearchParams(window.location.search);
            
            // Function to parse boolean parameters
            const parseBoolean = (param) => {
                return param === 'true' || param === '1';
            };
            
            // Function to parse numeric parameters
            const parseNumeric = (param) => {
                if (param === null || param === undefined) return null;
                return parseFloat(param) || 0;
            };
            
            // Apply parameters if they exist
            if (urlParams.has('isRefi')) {
                this.isRefi = parseBoolean(urlParams.get('isRefi'));
                this.updatePropertyValueLabel();
            }
            
            // We've removed existing1st, loanFunded, and tempBuydown parameters
            
            // Property value and loan amount
            if (urlParams.has('propertyValue')) {
                const propValue = parseNumeric(urlParams.get('propertyValue'));
                if (propValue !== null) {
                    this.propertyValue = this.formatCurrencyValue(propValue);
                }
            }
            
            if (urlParams.has('loanAmount')) {
                const loanValue = parseNumeric(urlParams.get('loanAmount'));
                if (loanValue !== null) {
                    this.loanAmount = this.formatCurrencyValue(loanValue);
                    this.calculateDownPaymentFromLoan();
                }
            }
            
            // Rental income parameters
            if (urlParams.has('numberOfUnits')) {
                const units = parseInt(urlParams.get('numberOfUnits'));
                if (!isNaN(units) && units > 0 && units <= 10) {
                    this.numberOfUnits = units;
                }
            }
            
            if (urlParams.has('rentalIncomeMethod')) {
                const method = urlParams.get('rentalIncomeMethod');
                if (method === 'total' || method === 'perUnit') {
                    this.rentalIncomeMethod = method;
                }
            }
            
            if (urlParams.has('totalRentalIncome')) {
                const income = parseNumeric(urlParams.get('totalRentalIncome'));
                if (income !== null) {
                    this.totalRentalIncome = this.formatCurrencyValue(income);
                }
            }
            
            // Check for per-unit incomes
            const newUnits = [];
            for (let i = 0; i < this.numberOfUnits; i++) {
                const unitParam = `unitIncome${i}`;
                if (urlParams.has(unitParam)) {
                    const unitIncome = parseNumeric(urlParams.get(unitParam));
                    newUnits.push({ income: unitIncome !== null ? this.formatCurrencyValue(unitIncome) : '0.00' });
                } else {
                    // Use default value for missing units
                    newUnits.push({ income: i === 0 ? '3,500.00' : '0.00' });
                }
            }
            
            if (newUnits.length > 0) {
                this.rentalUnits = newUnits;
            }
            
            // Loan terms
            if (urlParams.has('interestRate')) {
                const rate = parseNumeric(urlParams.get('interestRate'));
                if (rate !== null) {
                    this.interestRate = this.formatPercentValue(rate);
                }
            }
            
            if (urlParams.has('termYears')) {
                const term = parseInt(urlParams.get('termYears'));
                if (!isNaN(term) && term > 0) {
                    this.termYears = term;
                }
            }
            
            if (urlParams.has('isInterestOnly')) {
                this.isInterestOnly = parseBoolean(urlParams.get('isInterestOnly'));
            }
            
            // Property expenses
            if (urlParams.has('taxesPercent')) {
                const taxPercent = parseNumeric(urlParams.get('taxesPercent'));
                if (taxPercent !== null) {
                    this.taxesPercent = this.formatPercentValue(taxPercent);
                    this.calculateTaxesAmount();
                }
            }
            
            if (urlParams.has('insurancePercent')) {
                const insurancePercent = parseNumeric(urlParams.get('insurancePercent'));
                if (insurancePercent !== null) {
                    this.insurancePercent = this.formatPercentValue(insurancePercent);
                    this.calculateInsuranceAmount();
                }
            }
            
            if (urlParams.has('hoaFees')) {
                const hoa = parseNumeric(urlParams.get('hoaFees'));
                if (hoa !== null) {
                    this.hoaFees = this.formatCurrencyValue(hoa);
                }
            }
            
            // Auto-calculate if all required fields are populated from URL
            if (urlParams.has('propertyValue') && 
                urlParams.has('loanAmount') && 
                urlParams.has('totalRentalIncome') &&
                urlParams.has('interestRate')) {
                
                // Use setTimeout to ensure Alpine has initialized all fields
                setTimeout(() => {
                    this.calculateDSCR();
                }, 500);
            }
        }
    }));
});
