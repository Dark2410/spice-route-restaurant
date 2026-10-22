document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reservationForm');
    const formHeader = document.getElementById('formHeader');
    const confirmationBox = document.getElementById('confirmationBox');
    const bookingSummary = document.getElementById('bookingSummary');
    const bookAgainBtn = document.getElementById('bookAgainBtn');

    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');

    const RESTAURANT_NUMBER = '911234567890';
    const OPEN_TIME = '12:00';
    const CLOSE_TIME = '22:30'; // 10:30 PM last slot

    // 1. Get current date and time strings in local timezone
    function getNowStrings() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        return {
            today: `${year}-${month}-${day}`,
            currentTime: `${hours}:${minutes}`
        };
    }

    // 2. Disallow any date before today
    function lockPastDates() {
        const { today } = getNowStrings();
        dateInput.min = today;
    }
    lockPastDates();

    // 3. Convert 24-hr time ("20:15") to 12-hr readable format ("08:15 PM")
    function formatTo12Hour(time24) {
        if (!time24) return '';
        const [h, m] = time24.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
    }

    // 4. Validate date and time selection
    function validateDateTime(showAlert = false) {
        const { today, currentTime } = getNowStrings();
        const selectedDate = dateInput.value;
        const selectedTime = timeInput.value;

        // If no date picked yet
        if (!selectedDate) return true;

        // Block dates in the past
        if (selectedDate < today) {
            if (showAlert) alert('Please select today or a future date.');
            dateInput.value = today;
            return false;
        }

        // Adjust time bounds depending on whether date is today
        if (selectedDate === today) {
            // Min time is either opening time or current time (whichever is later)
            timeInput.min = currentTime > OPEN_TIME ? currentTime : OPEN_TIME;
        } else {
            timeInput.min = OPEN_TIME;
        }
        timeInput.max = CLOSE_TIME;

        // If time is entered, check validity
        if (selectedTime) {
            // Check operating hours
            if (selectedTime < OPEN_TIME || selectedTime > CLOSE_TIME) {
                if (showAlert) {
                    alert('Reservations are only accepted during operating hours: 12:00 PM to 10:30 PM.');
                }
                timeInput.value = '';
                return false;
            }

            // Check if selected time has already passed today
            if (selectedDate === today && selectedTime <= currentTime) {
                if (showAlert) {
                    alert('That time has already passed for today. Please choose an upcoming slot.');
                }
                timeInput.value = '';
                return false;
            }
        }

        return true;
    }

    // Event listeners for real-time validation
    dateInput.addEventListener('change', () => validateDateTime(false));
    timeInput.addEventListener('change', () => validateDateTime(true));

    // 5. Submit Form
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('number').value.trim();
        const selectedDate = dateInput.value;
        const selectedTime = timeInput.value;
        const guests = document.getElementById('guests').value;
        const requests = document.getElementById('requests').value.trim() || 'None';

        // Check required fields
        if (!name || !phone || !selectedDate || !selectedTime) {
            alert('Please fill out all required fields.');
            return;
        }

        // 10-digit phone number check
        if (!/^[0-9]{10}$/.test(phone)) {
            alert('Please enter a valid 10-digit mobile number.');
            document.getElementById('number').focus();
            return;
        }

        // Final check on past slot
        if (!validateDateTime(true)) {
            timeInput.focus();
            return;
        }

        const formattedTime = formatTo12Hour(selectedTime);

        // Build WhatsApp message
        const message =
            `*🍽️ NEW TABLE RESERVATION — Spice Route*\n\n` +
            `👤 *Name:* ${name}\n` +
            `📞 *Phone:* ${phone}\n` +
            `📅 *Date:* ${selectedDate}\n` +
            `⏰ *Time:* ${formattedTime}\n` +
            `👥 *Guests:* ${guests}\n` +
            `📝 *Special Requests:* ${requests}\n\n` +
            `_Please confirm availability for this slot._`;

        const whatsappUrl = `https://wa.me/${RESTAURANT_NUMBER}?text=${encodeURIComponent(message)}`;

        // Open WhatsApp in a new tab
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

        // Fill in confirmation summary card
        bookingSummary.innerHTML = `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Date & Time:</strong> ${selectedDate} at ${formattedTime}</p>
            <p><strong>Party Size:</strong> ${guests}</p>
            <p><strong>Special Requests:</strong> ${requests}</p>
        `;

        // Switch visible view from form to confirmation card
        form.style.display = 'none';
        if (formHeader) formHeader.style.display = 'none';
        confirmationBox.style.display = 'block';
    });

    // 6. Reset & Book Another Table
    bookAgainBtn.addEventListener('click', () => {
        form.reset();
        lockPastDates();
        timeInput.removeAttribute('min');
        timeInput.removeAttribute('max');

        confirmationBox.style.display = 'none';
        if (formHeader) formHeader.style.display = 'block';
        form.style.display = 'block';
    });
});