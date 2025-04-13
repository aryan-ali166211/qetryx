// SubmitCo form handling
class SubmitCo {
    constructor(formId, recipientEmail, successMessage, errorMessage) {
        this.form = document.getElementById(formId);
        this.recipientEmail = recipientEmail;
        this.successMessage = successMessage || 'Message sent successfully!';
        this.errorMessage = errorMessage || 'Failed to send message. Please try again.';
        
        if (this.form) {
            this.init();
        }
    }
    
    init() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const statusElement = this.form.querySelector('.status-message') || 
                                document.createElement('div');
            statusElement.className = 'status-message';
            statusElement.textContent = 'Sending...';
            
            if (!this.form.querySelector('.status-message')) {
                this.form.appendChild(statusElement);
            }
            
            try {
                const formData = this.getFormData();
                await this.sendEmail(formData);
                
                statusElement.textContent = this.successMessage;
                statusElement.className = 'status-message success';
                this.form.reset();
                
                setTimeout(() => {
                    statusElement.textContent = '';
                    statusElement.className = 'status-message';
                }, 5000);
            } catch (error) {
                console.error('SubmitCo error:', error);
                statusElement.textContent = this.errorMessage;
                statusElement.className = 'status-message error';
            }
        });
    }
    
    getFormData() {
        const formData = {};
        const inputs = this.form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            if (input.name || input.id) {
                const key = input.name || input.id;
                formData[key] = input.value;
            }
        });
        
        return formData;
    }
    
    async sendEmail(formData) {
        // This is a mock implementation - in a real app, you would:
        // 1. Use a serverless function (like AWS Lambda, Firebase Functions)
        // 2. Or use a service like Formspree, SendGrid, etc.
        
        console.log('Email would be sent to:', this.recipientEmail);
        console.log('Form data:', formData);
        
        // Simulate network request
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate random success/failure for demo
                Math.random() > 0.2 ? resolve() : reject(new Error('Simulated network error'));
            }, 1000);
        });
    }
}

// Initialize forms when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Contact form
    if (document.getElementById('contactForm')) {
        new SubmitCo(
            'contactForm',
            'aryan.ali.king.master@gmail.com',
            'Your message has been sent! We\'ll get back to you soon.',
            'Failed to send message. Please try again.'
        );
    }
    
    // Request mod form
    if (document.getElementById('requestForm')) {
        new SubmitCo(
            'requestForm',
            'aryan.ali.king.master@gmail.com',
            'Your mod request has been submitted! We\'ll review it soon.',
            'Failed to submit request. Please try again.'
        );
    }
});