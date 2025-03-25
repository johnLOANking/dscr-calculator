/**
 * DSCR Calculator Main Logic
 * This file contains the Alpine.js component and main calculation logic
 */

// Define the Alpine.js component
console.log("Calculator.js loaded");

document.addEventListener('alpine:init', () => {
    console.log("Alpine initialized");
    Alpine.data('dscrCalculator', () => ({
        // Calculator state
        isRefi: false,
        existing1st: false,
        loanFunded: false,
        tempBuydown: false,
        propertyValue: '600,000.00',
        propertyValueLabel: 'Purchase Price',
        showDownPaymentPercent: true,
        downPaymentPercent: '25.00',
        downPaymentAmount: '150,000.00',
        loanAmount: '450,000.00',
        
        numberOfUnits: 1,
        rentalIncomeMethod: 'total',
        totalRentalIncome: '3,500.00',
        rentalUnits: [{ income: '3,500.00' }],
        
        interestRate: '6.125',
        termYears: 30,
        isInterestOnly: false,
        
        showTaxesInPercent: true,
        taxesPercent: '1.25',
        taxesAmount: '7,500.00',
        
        showInsuranceInPercent: true,
        insurancePercent: '0.35',
        insuranceAmount: '2,100.00',
        
        hoaFees: '',
        
        // Results
        showResults: false,
        monthlyMortgagePayment: 0,
        monthlyTaxes: 0,
        monthlyInsurance: 0,
        totalMonthlyExpenses: 0,
        dscrValue: 0,
        dscrMessage: '',
        dscrMessageClass: '',
        dscrMessages: [],
        
        // Shareable link
        shareableLink: '',
        
        /**
         * Initialize the calculator
         */
        async initialize() {
            console.log("Initialize calculator starting");
            
            // Load default rates and tax/insurance percentages
            await this.loadDefaults();
            
            // Load DSCR messages
            await this.loadDSCRMessages();
            
            // Apply URL parameters if present
            this.applyUrlParams();
            
            // Initialize calculated fields
            this.updatePropertyValueLabel();
            this.calculateLoanAmount();
            this.updateRentalIncomeInputs();
            this.calculateTaxesAmount();
            this.calculateInsuranceAmount();
            
            // Add input change listeners
            this.addInputChangeListeners();
            
            console.log("Calculator initialization completed");
        },
        
        /**
         * Load default rates and tax/insurance percentages from JSON files
         */
        async loadDefaults() {
            try {
                // Load tax and insurance defaults
                const taxInsResponse = await fetch('https://raw.githubusercontent.com/johnLOANking/reference/refs/heads/main/Tax_ins.json');
                const taxInsData = await taxInsResponse.json();
                
                // Set tax and insurance defaults from JSON
                if (taxInsData && taxInsData.defaults) {
                    console.log("Loaded tax and insurance defaults:", taxInsData);
                    this.taxesPercent = taxInsData.defaults.taxes.percentage.toFixed(2);
                    this.insurancePercent = taxInsData.defaults.insurance.percentage.toFixed(2);
                    
                    // Calculate initial tax and insurance amounts
                    this.calculateTaxesAmount();
                    this.calculateInsuranceAmount();
                } else {
                    console.error("Tax and insurance defaults not found in JSON response");
                }
                
                // Load interest rate from rates.json
                const ratesResponse = await fetch('https://raw.githubusercontent.com/johnLOANking/reference/refs/heads/main/rates.json');
                const ratesData = await ratesResponse.json();
                
                // Set interest rate from JSON (assuming first rate or specific format)
                if (ratesData && ratesData.rates && ratesData.rates.length > 0) {
                    console.log("Loaded interest rate:", ratesData.rates[0].rate);
                    this.interestRate = ratesData.rates[0].rate.toFixed(3);
                } else {
                    console.error("Interest rate not found in JSON response");
                }
            } catch (error) {
                console.error('Error loading defaults:', error);
                // Continue with hardcoded defaults if JSON loading fails
                
                // Set hardcoded defaults
                this.taxesPercent = '1.25';
                this.insurancePercent = '0.35';
                this.interestRate = '6.125';
                
                // Calculate initial tax and insurance amounts
                this.calculateTaxesAmount();
                this.calculateInsuranceAmount();
            }
        },
        
        /**
         * Load DSCR result messages from JSON
         */
        async loadDSCRMessages() {
            try {
                console.log("Loading DSCR messages");
                const response = await fetch('data/dscr-messages.json');
                const data = await response.json();
                
                if (data && data.dscrMessages) {
                    console.log("DSCR messages loaded successfully:", data.dscrMessages);
                    this.dscrMessages = data.dscrMessages;
                } else {
                    console.error("DSCR messages JSON structure is not as expected");
                }
            } catch (error) {
                console.error('Error loading DSCR messages:', error);
                
                // Fallback to hardcoded messages if JSON loading fails
                console.log("Using fallback hardcoded DSCR messages");
                this.dscrMessages = [
                    {
                        min: 1.25,
                        max: 9999,
                        message: "Your ratios are as good as they get, you are in great shape to qualify"
                    },
                    {
                        min: 1.0,
                        max: 1.249,
                        message: "You meet the requirements for most loans"
                    },
                    {
                        min: 0.75,
                        max: 0.999,
                        message: "Your rent does not cover your payment, but we may still be able to qualify you for this loan (rates are likely going to be higher due to negative cash flow)"
                    },
                    {
                        min: 0,
                        max: 0.749,
                        message: "Your rent is significantly below your mortgage payment. There is a slight chance we can still proceed, contact our office to discuss details"
                    }
                ];
            }
        },
        
        /**
         * Add event listeners to hide results when inputs change
         */
        addInputChangeListeners() {
            const inputs = document.querySelectorAll('#dscr-calculator input');
            const buttons = document.querySelectorAll('#dscr-calculator button:not(.calculate-btn):not(.share-btn)');
            
            const hideResults = () => {
                this.showResults = false;
                this.shareableLink = '';
            };
            
            inputs.forEach(input => {
                input.addEventListener('change', hideResults);
            });
            
            buttons.forEach(button => {
                button.addEventListener('click', hideResults);
            });
        },
        
        /**
         * Update property value label based on loan type
         */
        updatePropertyValueLabel() {
            this.propertyValueLabel = this.isRefi ? 'Appraised Value' : 'Purchase Price';
        },
        
        /**
         * Toggle between down payment percent and amount
         */
        toggleDownPaymentType(type) {
            this.showDownPaymentPercent = (type === 'percent');
        },
        
        /**
         * Toggle between taxes percent and amount
         */
        toggleTaxesType(type) {
            this.showTaxesInPercent = (type === 'percent');
        },
        
        /**
         * Toggle between insurance percent and amount
         */
        toggleInsuranceType(type) {
            this.showInsuranceInPercent = (type === 'percent');
        },
        
        /**
         * Calculate loan amount from property value and down payment percentage
         */
        calculateLoanAmountFromPercent() {
            const propValue = this.parseFormattedCurrency(this.propertyValue);
            const downPercent = this.parseFormattedPercent(this.downPaymentPercent);
            
            const downAmount = propValue * (downPercent / 100);
            const loan = propValue - downAmount;
            
            this.downPaymentAmount = this.formatCurrencyValue(downAmount);
            this.loanAmount = this.formatCurrencyValue(loan);
        },
        
        /**
         * Calculate down payment percent from loan amount
         */
        calculateDownPaymentFromLoan() {
            const propValue = this.parseFormattedCurrency(this.propertyValue);
            const loan = this.parseFormattedCurrency(this.loanAmount);
            
            if (propValue > 0) {
                const downAmount = propValue - loan;
                const downPercent = (downAmount / propValue) * 100;
                
                this.downPaymentAmount = this.formatCurrencyValue(downAmount);
                this.downPaymentPercent = this.formatPercentValue(downPercent);
            }
        },
        
        /**
         * Calculate down payment percent from down payment amount
         */
        calculateDownPaymentPercent() {
            const propValue = this.parseFormattedCurrency(this.propertyValue);
            const downAmount = this.parseFormattedCurrency(this.downPaymentAmount);
            
            if (propValue > 0) {
                const downPercent = (downAmount / propValue) * 100;
                const loan = propValue - downAmount;
                
                this.downPaymentPercent = this.formatPercentValue(downPercent);
                this.loanAmount = this.formatCurrencyValue(loan);
            }
        },
        
        /**
         * Calculate loan amount based on property value and down payment
         */
        calculateLoanAmount() {
            if (this.showDownPaymentPercent) {
                this.calculateLoanAmountFromPercent();
            } else {
                this.calculateDownPaymentPercent();
            }
        },
        
        /**
         * Update rental income inputs based on number of units and income method
         */
        updateRentalIncomeInputs() {
            // Limit number of units to max 10
            if (this.numberOfUnits > 10) {
                this.numberOfUnits = 10;
            }
            
            // Create or update rental unit array
            const newUnits = [];
            for (let i = 0; i < this.numberOfUnits; i++) {
                if (this.rentalUnits[i]) {
                    newUnits.push(this.rentalUnits[i]);
                } else {
                    // For first unit, use default value, others 0
                    const defaultValue = i === 0 ? '3,500.00' : '0.00';
                    newUnits.push({ income: defaultValue });
                }
            }
            this.rentalUnits = newUnits;
            
            // If we're using the per-unit method, update total rental income
            if (this.rentalIncomeMethod === 'perUnit') {
                this.calculateTotalRentalIncome();
            } else if (this.numberOfUnits === 1) {
                // If there's only one unit and we're using total method,
                // update the first unit's income to match total
                if (this.rentalUnits.length > 0) {
                    this.rentalUnits[0].income = this.totalRentalIncome;
                }
            }
            
            // If we switch to per-unit method and have multiple units,
            // distribute total income among units
            if (this.rentalIncomeMethod === 'perUnit' && this.numberOfUnits > 1) {
                const totalIncome = this.parseFormattedCurrency(this.totalRentalIncome);
                const perUnitIncome = totalIncome / this.numberOfUnits;
                
                this.rentalUnits.forEach((unit, index) => {
                    unit.income = this.formatCurrencyValue(perUnitIncome);
                });
            }
            
            console.log("Updated rental units:", this.rentalUnits, "Method:", this.rentalIncomeMethod);
        },
        
        /**
         * Calculate total rental income from individual units
         */
        calculateTotalRentalIncome() {
            if (this.rentalIncomeMethod === 'perUnit') {
                let total = 0;
                this.rentalUnits.forEach(unit => {
                    total += this.parseFormattedCurrency(unit.income);
                });
                this.totalRentalIncome = this.formatCurrencyValue(total);
                console.log("Total rental income calculated:", this.totalRentalIncome);
            }
        },
        
        /**
         * Calculate taxes amount from percentage
         */
        calculateTaxesAmount() {
            const propValue = this.parseFormattedCurrency(this.propertyValue);
            const taxPercent = this.parseFormattedPercent(this.taxesPercent);
            
            const taxAmount = propValue * (taxPercent / 100);
            this.taxesAmount = this.formatCurrencyValue(taxAmount);
        },
        
        /**
         * Calculate taxes percentage from amount
         */
        calculateTaxesPercent() {
            const propValue = this.parseFormattedCurrency(this.propertyValue);
            const taxAmount = this.parseFormattedCurrency(this.taxesAmount);
            
            if (propValue > 0) {
                const taxPercent = (taxAmount / propValue) * 100;
                this.taxesPercent = this.formatPercentValue(taxPercent);
            }
        },
        
        /**
         * Calculate insurance amount from percentage
         */
        calculateInsuranceAmount() {
            const propValue = this.parseFormattedCurrency(this.propertyValue);
            const insPercent = this.parseFormattedPercent(this.insurancePercent);
            
            const insAmount = propValue * (insPercent / 100);
            this.insuranceAmount = this.formatCurrencyValue(insAmount);
        },
        
        /**
         * Calculate insurance percentage from amount
         */
        calculateInsurancePercent() {
            const propValue = this.parseFormattedCurrency(this.propertyValue);
            const insAmount = this.parseFormattedCurrency(this.insuranceAmount);
            
            if (propValue > 0) {
                const insPercent = (insAmount / propValue) * 100;
                this.insurancePercent = this.formatPercentValue(insPercent);
            }
        },
        
        /**
         * Calculate DSCR (Debt Service Coverage Ratio)
         */
        calculateDSCR() {
            // Parse input values
            const loanAmount = this.parseFormattedCurrency(this.loanAmount);
            const interestRate = this.parseFormattedPercent(this.interestRate);
            const termMonths = this.termYears * 12;
            const rentalIncome = this.parseFormattedCurrency(this.totalRentalIncome);
            const taxesAnnual = this.parseFormattedCurrency(this.taxesAmount);
            const insuranceAnnual = this.parseFormattedCurrency(this.insuranceAmount);
            const hoaMonthly = this.parseFormattedCurrency(this.hoaFees) || 0;
            
            // Calculate monthly mortgage payment
            if (this.isInterestOnly) {
                // Interest-only payment calculation
                this.monthlyMortgagePayment = (loanAmount * (interestRate / 100)) / 12;
            } else {
                // Amortized payment calculation
                const monthlyRate = (interestRate / 100) / 12;
                if (monthlyRate === 0) {
                    // Handle zero interest rate case
                    this.monthlyMortgagePayment = loanAmount / termMonths;
                } else {
                    // Standard amortization formula
                    this.monthlyMortgagePayment = loanAmount * monthlyRate * 
                        Math.pow(1 + monthlyRate, termMonths) / 
                        (Math.pow(1 + monthlyRate, termMonths) - 1);
                }
            }
            
            // Calculate monthly taxes and insurance
            this.monthlyTaxes = taxesAnnual / 12;
            this.monthlyInsurance = insuranceAnnual / 12;
            
            // Calculate total monthly expenses
            this.totalMonthlyExpenses = this.monthlyMortgagePayment + this.monthlyTaxes + 
                this.monthlyInsurance + hoaMonthly;
            
            // Calculate DSCR (rental income / total expenses)
            if (this.totalMonthlyExpenses > 0) {
                this.dscrValue = rentalIncome / this.totalMonthlyExpenses;
            } else {
                this.dscrValue = 0;
            }
            
            // Get appropriate message based on DSCR value
            this.setDSCRMessage();
            
            // Show results
            this.showResults = true;
            
            // Clear any previous shareable link
            this.shareableLink = '';
            
            return this.dscrValue;
        },
        
        /**
         * Set DSCR message and message class based on DSCR value
         */
        setDSCRMessage() {
            // Find the appropriate message for the DSCR value
            let message = "No matching DSCR range found.";
            let messageClass = "warning";
            
            for (const range of this.dscrMessages) {
                if (this.dscrValue >= range.min && this.dscrValue <= range.max) {
                    message = range.message;
                    
                    // Set message class based on DSCR range
                    if (this.dscrValue >= 1.25) {
                        messageClass = "excellent";
                    } else if (this.dscrValue >= 1.0) {
                        messageClass = "good";
                    } else if (this.dscrValue >= 0.75) {
                        messageClass = "warning";
                    } else {
                        messageClass = "danger";
                    }
                    
                    break;
                }
            }
            
            this.dscrMessage = message;
            this.dscrMessageClass = messageClass;
        },
        
        /**
         * Generate a shareable link with URL parameters
         */
        generateShareableLink() {
            const url = new URL(window.location.href.split('?')[0]);
            
            // Add parameters for all relevant fields
            url.searchParams.set('isRefi', this.isRefi);
            url.searchParams.set('propertyValue', this.parseFormattedCurrency(this.propertyValue));
            url.searchParams.set('loanAmount', this.parseFormattedCurrency(this.loanAmount));
            url.searchParams.set('numberOfUnits', this.numberOfUnits);
            url.searchParams.set('rentalIncomeMethod', this.rentalIncomeMethod);
            url.searchParams.set('totalRentalIncome', this.parseFormattedCurrency(this.totalRentalIncome));
            
            // Add per-unit rental incomes if using per-unit method
            if (this.rentalIncomeMethod === 'perUnit') {
                this.rentalUnits.forEach((unit, index) => {
                    url.searchParams.set(`unitIncome${index}`, this.parseFormattedCurrency(unit.income));
                });
            }
            
            url.searchParams.set('interestRate', this.parseFormattedPercent(this.interestRate));
            url.searchParams.set('termYears', this.termYears);
            url.searchParams.set('isInterestOnly', this.isInterestOnly);
            url.searchParams.set('taxesPercent', this.parseFormattedPercent(this.taxesPercent));
            url.searchParams.set('insurancePercent', this.parseFormattedPercent(this.insurancePercent));
            url.searchParams.set('hoaFees', this.parseFormattedCurrency(this.hoaFees));
            
            // Add a cache-busting version parameter
            url.searchParams.set('v', new Date().getTime());
            
            this.shareableLink = url.toString();
        },
        
        /**
         * Copy the shareable link to clipboard
         */
        copyToClipboard() {
            navigator.clipboard.writeText(this.shareableLink)
                .then(() => {
                    alert('Link copied to clipboard!');
                })
                .catch(err => {
                    console.error('Failed to copy link: ', err);
                    alert('Failed to copy link. Please select and copy manually.');
                });
        },
        
        /**
         * Format currency value for input field
         */
        formatCurrencyValue(value) {
            return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value);
        },
        
        /**
         * Format percent value for input field
         */
        formatPercentValue(value) {
            return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value);
        },
        
        /**
         * Format currency for output display
         */
        formatCurrencyOutput(value) {
            return ' + new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value);
        },
        
        /**
         * Format currency input on change
         */
        formatCurrency(event, field, unitIndex) {
            if (event && event.target) {
                let value = event.target.value.replace(/[^\d.]/g, '');
                const numValue = parseFloat(value) || 0;
                
                const formattedValue = this.formatCurrencyValue(numValue);
                
                if (field) {
                    this[field] = formattedValue;
                } else if (unitIndex !== undefined) {
                    this.rentalUnits[unitIndex].income = formattedValue;
                } else {
                    event.target.value = formattedValue;
                }
            }
        },
        
        /**
         * Format percent input on change
         */
        formatPercent(event, field) {
            if (event && event.target) {
                let value = event.target.value.replace(/[^\d.]/g, '');
                const numValue = parseFloat(value) || 0;
                
                const formattedValue = this.formatPercentValue(numValue);
                
                if (field) {
                    this[field] = formattedValue;
                } else {
                    event.target.value = formattedValue;
                }
            }
        },
        
        /**
         * Parse formatted currency string to number
         */
        parseFormattedCurrency(value) {
            if (typeof value === 'number') return value;
            return parseFloat(value.replace(/[^\d.]/g, '')) || 0;
        },
        
        /**
         * Parse formatted percent string to number
         */
        parseFormattedPercent(value) {
            if (typeof value === 'number') return value;
            return parseFloat(value.replace(/[^\d.]/g, '')) || 0;
        }
    }));
});
