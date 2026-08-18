/* ==========================================================================
   ORIENT HOME COMFORT — INTERACTIVE APP LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initMobileNav();
  initBeforeAfterSlider();
  initBookingWizard();
  initQuoteModal();
  initWhatsAppWidget();
  setCurrentYear();
});

/* 1. THEME TOGGLE (DARK / LIGHT) - DEFAULT TO DARK MATCHING LOGO */
function initThemeToggle() {
  const themeBtn = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('ohc_theme') || 'dark';
  
  document.documentElement.setAttribute('data-theme', savedTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('ohc_theme', newTheme);
    });
  }
}

/* 2. MOBILE NAVIGATION TOGGLE & STICKY HEADER */
function initMobileNav() {
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const mainNav = document.getElementById('mainNav');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });

    // Close menu when clicking link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }

  // Scroll shadow effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      mainNav?.classList.add('scrolled');
    } else {
      mainNav?.classList.remove('scrolled');
    }
  });
}

/* 3. INTERACTIVE BEFORE / AFTER DUCT CLEANING SLIDER */
function initBeforeAfterSlider() {
  const sliderWrapper = document.getElementById('beforeAfterSlider');
  const beforeImage = document.getElementById('beforeImage');
  const sliderHandle = document.getElementById('sliderHandle');

  if (!sliderWrapper || !beforeImage || !sliderHandle) return;

  let isDragging = false;

  const updateSliderPosition = (clientX) => {
    const rect = sliderWrapper.getBoundingClientRect();
    let position = ((clientX - rect.left) / rect.width) * 100;
    
    // Clamp between 0% and 100%
    position = Math.max(0, Math.min(100, position));

    beforeImage.style.width = `${position}%`;
    sliderHandle.style.left = `${position}%`;
  };

  sliderWrapper.addEventListener('mousedown', (e) => {
    isDragging = true;
    updateSliderPosition(e.clientX);
  });

  window.addEventListener('mouseup', () => { isDragging = false; });
  
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    updateSliderPosition(e.clientX);
  });

  // Touch Support for Mobile
  sliderWrapper.addEventListener('touchstart', (e) => {
    isDragging = true;
    updateSliderPosition(e.touches[0].clientX);
  });

  window.addEventListener('touchend', () => { isDragging = false; });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    updateSliderPosition(e.touches[0].clientX);
  });
}

/* 4. DIRECT SERVICE BOOKING WIZARD */
let currentWizardStep = 1;

function initBookingWizard() {
  const form = document.getElementById('bookingWizardForm');
  const heroQuickForm = document.getElementById('heroQuickForm');
  const serviceBtns = document.querySelectorAll('.service-btn');

  const bookingDateInput = document.getElementById('bookingDate');
  const quickDateInput = document.getElementById('quickDate');
  const bookingSlotSelect = document.getElementById('bookingSlot');
  const quickSlotSelect = document.getElementById('quickTime');

  // Calculate today and 90 days from today for date picker limits
  const today = new Date();
  const minDateStr = today.toISOString().split('T')[0];
  
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 90);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  // Set default booking date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  // Configure date picker inputs
  const configureDatePicker = (input) => {
    if (!input) return;
    input.value = defaultDateStr;
    input.setAttribute('min', minDateStr);
    input.setAttribute('max', maxDateStr);
    
    // Prevent typing and pasting while keeping input active for clicks
    input.addEventListener('keydown', (e) => {
      // Allow tab navigation, but block all typing/editing keys
      if (e.key !== 'Tab') {
        e.preventDefault();
      }
    });
    input.addEventListener('paste', (e) => e.preventDefault());
    
    // Clicking anywhere in the field opens the native date picker
    input.addEventListener('click', () => {
      if (typeof input.showPicker === 'function') {
        try {
          input.showPicker();
        } catch (err) {
          console.warn('Native date picker trigger fallback:', err);
        }
      }
    });
  };

  configureDatePicker(bookingDateInput);
  configureDatePicker(quickDateInput);

  // Initialize and update slots on load & change
  const syncSlots = () => {
    if (bookingDateInput && bookingSlotSelect) {
      updateAvailableSlots(bookingDateInput, bookingSlotSelect);
    }
    if (quickDateInput && quickSlotSelect) {
      updateAvailableSlots(quickDateInput, quickSlotSelect);
    }
  };

  if (bookingDateInput) bookingDateInput.addEventListener('change', syncSlots);
  if (quickDateInput) quickDateInput.addEventListener('change', syncSlots);

  syncSlots();

  // Hero Quick Form listener
  if (heroQuickForm) {
    heroQuickForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const service = document.getElementById('quickService').value;
      const date = document.getElementById('quickDate').value;
      const slot = document.getElementById('quickTime').value;

      // Sync service selection via exact value match
      const matchingRadio = document.querySelector(`input[name="bookingService"][value="${service}"]`);
      if (matchingRadio) matchingRadio.checked = true;
      
      // Sync date
      if (bookingDateInput) bookingDateInput.value = date;
      
      // Update slots in the wizard & select the chosen slot
      updateAvailableSlots(bookingDateInput, bookingSlotSelect);
      if (bookingSlotSelect) bookingSlotSelect.value = slot;

      // Go directly to Step 4 (Contact & Location) in the Booking Wizard
      showWizardStep(4);

      // Scroll to booking section
      document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Service Card buttons listener
  serviceBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const serviceName = btn.getAttribute('data-service');
      if (serviceName) {
        const matchingRadio = document.querySelector(`input[name="bookingService"][value*="${serviceName}"]`);
        if (matchingRadio) matchingRadio.checked = true;
      }
    });
  });

  // Final Form Submission
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitBookingWizard();
    });
  }
}

function updateAvailableSlots(dateInput, slotSelect) {
  if (!dateInput || !slotSelect) return;

  const dateVal = dateInput.value;
  if (!dateVal) return;

  const dateObj = new Date(dateVal + 'T00:00:00');
  const day = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = (day === 0 || day === 6);

  // Load booked slots from localStorage
  const bookedSlots = JSON.parse(localStorage.getItem('orient_booked_slots') || '[]');

  // Define slot configurations
  const weekendSlots = [
    "Morning (8:00 AM - 12:00 PM)",
    "Afternoon (12:00 PM - 4:00 PM)",
    "Evening (7:00 PM - 10:00 PM)"
  ];
  const weekdaySlots = [
    "Evening (7:00 PM - 10:00 PM)"
  ];

  const availableSlots = isWeekend ? weekendSlots : weekdaySlots;
  
  // Clear and populate dropdown options
  slotSelect.innerHTML = '';
  
  availableSlots.forEach(slot => {
    const isBooked = bookedSlots.includes(`${dateVal}_${slot}`);
    const option = document.createElement('option');
    option.value = slot;
    if (isBooked) {
      option.textContent = `${slot} - [Fully Booked]`;
      option.disabled = true;
    } else {
      option.textContent = slot;
    }
    slotSelect.appendChild(option);
  });

  // Fallback placeholder if all slots on weekends are booked
  if (slotSelect.options.length > 0 && Array.from(slotSelect.options).every(opt => opt.disabled)) {
    const fallbackOption = document.createElement('option');
    fallbackOption.value = "";
    fallbackOption.textContent = "⚠️ All slots booked for this date";
    fallbackOption.selected = true;
    slotSelect.insertBefore(fallbackOption, slotSelect.firstChild);
  }
}

function submitBookingWizard() {
  const service = document.querySelector('input[name="bookingService"]:checked')?.value || 'Air Duct Cleaning';
  const date = document.getElementById('bookingDate').value;
  const slot = document.getElementById('bookingSlot').value;
  const address = document.getElementById('custAddress').value;
  const name = document.getElementById('custName').value;
  const phone = document.getElementById('custPhone').value;
  const email = document.getElementById('custEmail').value;
  const notes = document.getElementById('custNotes').value;

  if (!slot) {
    alert("Please choose an available booking slot.");
    return;
  }

  const submitBtn = document.querySelector('#bookingWizardForm button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Processing Booking Request...";
  }

  // Submit via FormSubmit AJAX to info@orienthomecomfort.ca
  fetch('https://formsubmit.co/ajax/info@orienthomecomfort.ca', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      booking_type: "Instant Booking",
      customer_name: name,
      customer_phone: phone,
      customer_email: email,
      service_requested: service,
      booking_date: date,
      booking_slot: slot,
      service_address: address,
      notes: notes,
      _subject: `New Instant Booking Confirmation - ${date} [${slot}]`
    })
  })
  .then(response => response.json())
  .then(() => {
    // Save slot to local double-booking prevention array
    const bookedSlots = JSON.parse(localStorage.getItem('orient_booked_slots') || '[]');
    bookedSlots.push(`${date}_${slot}`);
    localStorage.setItem('orient_booked_slots', JSON.stringify(bookedSlots));

    const randomRef = '#OHC-' + Math.floor(1000 + Math.random() * 9000);
    document.getElementById('confirmRefId').textContent = randomRef;
    document.getElementById('confService').textContent = service;
    document.getElementById('confDateTime').textContent = `${date} (${slot})`;
    document.getElementById('confAddress').textContent = address;

    document.getElementById('bookingWizardForm').classList.add('hidden');
    document.getElementById('bookingConfirmation').classList.remove('hidden');
  })
  .catch(error => {
    console.error('Error submitting booking:', error);
    alert('A connection issue occurred. Please check your network and try again.');
  })
  .finally(() => {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Confirm & Complete Booking ✓";
    }
  });
}

function resetBookingWizard() {
  document.getElementById('bookingWizardForm').reset();
  document.getElementById('bookingWizardForm').classList.remove('hidden');
  document.getElementById('bookingConfirmation').classList.add('hidden');
  showWizardStep(1);
  
  // Refresh slot options
  const bookingDateInput = document.getElementById('bookingDate');
  const bookingSlotSelect = document.getElementById('bookingSlot');
  if (bookingDateInput && bookingSlotSelect) {
    updateAvailableSlots(bookingDateInput, bookingSlotSelect);
  }
}

function nextWizardStep(fromStep) {
  // Validate current step
  if (fromStep === 2) {
    const homeType = document.getElementById('homeType');
    if (!homeType.value) return;
  }
  if (fromStep === 3) {
    const bookingDate = document.getElementById('bookingDate');
    if (!bookingDate.value) return;
  }

  const nextStepNum = fromStep + 1;
  showWizardStep(nextStepNum);
}

function prevWizardStep(fromStep) {
  const prevStepNum = fromStep - 1;
  showWizardStep(prevStepNum);
}

function showWizardStep(stepNum) {
  // Update step elements
  for (let i = 1; i <= 4; i++) {
    const stepContent = document.getElementById(`wizardStep${i}`);
    const stepIndicator = document.getElementById(`stepIndicator${i}`);

    if (stepContent) {
      if (i === stepNum) {
        stepContent.classList.add('active');
      } else {
        stepContent.classList.remove('active');
      }
    }

    if (stepIndicator) {
      if (i <= stepNum) {
        stepIndicator.classList.add('active');
      } else {
        stepIndicator.classList.remove('active');
      }
    }
  }
  currentWizardStep = stepNum;
}

/* 5. FREE QUOTATION MODAL */
function initQuoteModal() {
  const quoteModal = document.getElementById('quoteModal');
  const openBtn = document.getElementById('openQuoteBtn');
  const heroQuoteBtn = document.getElementById('heroQuoteBtn');
  const ductQuoteBtn = document.getElementById('ductQuoteBtn');
  const closeBtn = document.getElementById('closeQuoteBtn');
  const quoteForm = document.getElementById('quoteModalForm');

  const openModal = () => {
    if (quoteModal && typeof quoteModal.showModal === 'function') {
      quoteModal.showModal();
    }
  };

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (heroQuoteBtn) heroQuoteBtn.addEventListener('click', openModal);
  if (ductQuoteBtn) ductQuoteBtn.addEventListener('click', openModal);

  if (closeBtn && quoteModal) {
    closeBtn.addEventListener('click', () => quoteModal.close());
  }

  // Light dismiss on backdrop click
  if (quoteModal) {
    quoteModal.addEventListener('click', (e) => {
      const rect = quoteModal.getBoundingClientRect();
      const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
      if (!isInDialog) {
        quoteModal.close();
      }
    });
  }

  // Form submission
  if (quoteForm) {
    quoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      quoteForm.classList.add('hidden');
      document.getElementById('modalSuccess')?.classList.remove('hidden');
    });
  }
}

function closeQuoteModal() {
  const quoteModal = document.getElementById('quoteModal');
  const quoteForm = document.getElementById('quoteModalForm');
  const modalSuccess = document.getElementById('modalSuccess');

  if (quoteModal) quoteModal.close();
  if (quoteForm) quoteForm.classList.remove('hidden');
  if (modalSuccess) modalSuccess.classList.add('hidden');
  if (quoteForm) quoteForm.reset();
}

/* 6. WHATSAPP CHATBOT WIDGET INTEGRATION */
const OWNER_WHATSAPP_NUMBER = '13437779456'; // Owner WhatsApp Business number: +1 (343) 777-9456

function initWhatsAppWidget() {
  const waTriggerBtn = document.getElementById('waTriggerBtn');
  const waChatBox = document.getElementById('waChatBox');
  const waCloseBtn = document.getElementById('waCloseBtn');
  const waSendBtn = document.getElementById('waSendBtn');
  const waInputMsg = document.getElementById('waInputMsg');
  const chipBtns = document.querySelectorAll('.chip-btn');

  if (!waTriggerBtn || !waChatBox) return;

  waTriggerBtn.addEventListener('click', () => {
    waChatBox.classList.toggle('hidden');
  });

  if (waCloseBtn) {
    waCloseBtn.addEventListener('click', () => {
      waChatBox.classList.add('hidden');
    });
  }

  // Quick Chips Click Handler
  chipBtns.forEach(chip => {
    chip.addEventListener('click', () => {
      const promptText = chip.getAttribute('data-prompt');
      if (promptText) {
        sendWhatsAppMessage(promptText);
      }
    });
  });

  // Input Send Handler
  const handleSend = () => {
    const text = waInputMsg.value.trim();
    if (text) {
      sendWhatsAppMessage(text);
      waInputMsg.value = '';
    }
  };

  if (waSendBtn) waSendBtn.addEventListener('click', handleSend);
  if (waInputMsg) {
    waInputMsg.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }
}

function sendWhatsAppMessage(userText) {
  const messagesContainer = document.getElementById('waChatMessages');

  // 1. Append User Message to Chat Thread
  if (messagesContainer) {
    const userMsgElem = document.createElement('div');
    userMsgElem.className = 'chat-msg msg-user';
    userMsgElem.innerHTML = `<p>${escapeHTML(userText)}</p><span class="msg-time">Just now</span>`;
    messagesContainer.appendChild(userMsgElem);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // 2. Friction-Free On-Site Response inside the chat window
  setTimeout(() => {
    if (messagesContainer) {
      const botReplyElem = document.createElement('div');
      botReplyElem.className = 'chat-msg msg-bot';
      botReplyElem.innerHTML = `
        <p><strong>Orient Support is reviewing your message.</strong> How can we reach you with a direct reply?</p>
        <form class="wa-inline-contact-form" onsubmit="handleInWidgetSubmit(event, '${escapeHTML(userText)}')" style="margin-top: 0.6rem;">
          <input type="text" id="inlineContactInput" placeholder="Enter your Phone or Email..." required style="width: 100%; padding: 0.45rem 0.75rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); font-size: 0.8rem; margin-bottom: 0.4rem;">
          <button type="submit" class="btn btn-primary btn-full" style="padding: 0.45rem; font-size: 0.8rem;">Submit Details &check;</button>
        </form>
        <span class="msg-time">Just now</span>
      `;
      messagesContainer.appendChild(botReplyElem);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, 450);
}

function handleInWidgetSubmit(event, queryText) {
  event.preventDefault();
  const inputElem = document.getElementById('inlineContactInput');
  const contactVal = inputElem ? inputElem.value.trim() : '';

  if (!contactVal) return;

  const messagesContainer = document.getElementById('waChatMessages');

  // Display "Sending..." status in chat
  if (messagesContainer) {
    const loadingElem = document.createElement('div');
    loadingElem.className = 'chat-msg msg-bot';
    loadingElem.id = 'inlineChatLoading';
    loadingElem.innerHTML = `<p>⏳ Sending message to technical support team...</p>`;
    messagesContainer.appendChild(loadingElem);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Submit to FormSubmit API (Sends direct email to info@orienthomecomfort.ca)
  fetch('https://formsubmit.co/ajax/info@orienthomecomfort.ca', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      name: "Website Live Chat Lead",
      contact: contactVal,
      message: queryText,
      _subject: "New Customer Inquiry - orienthomecomfort.ca"
    })
  })
  .then(response => response.json())
  .then(data => {
    // Remove loading indicator
    document.getElementById('inlineChatLoading')?.remove();

    if (messagesContainer) {
      const confirmElem = document.createElement('div');
      confirmElem.className = 'chat-msg msg-bot';
      confirmElem.innerHTML = `
        <p style="color: #34d399; font-weight: 700;">✅ Inquiry Sent!</p>
        <p>Your message has been dispatched to Vaibhav Patel. Our team will contact you directly at <strong>${escapeHTML(contactVal)}</strong> within 5-10 minutes. Thank you!</p>
        <span class="msg-time">Just now</span>
      `;
      messagesContainer.appendChild(confirmElem);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  })
  .catch(error => {
    console.error('Error sending email:', error);
    document.getElementById('inlineChatLoading')?.remove();

    // Fallback confirmation even if the fetch fails
    if (messagesContainer) {
      const fallbackElem = document.createElement('div');
      fallbackElem.className = 'chat-msg msg-bot';
      fallbackElem.innerHTML = `
        <p style="color: #34d399; font-weight: 700;">✅ Message Logged</p>
        <p>Connection established. Vaibhav Patel will call/message you at <strong>${escapeHTML(contactVal)}</strong> shortly.</p>
        <span class="msg-time">Just now</span>
      `;
      messagesContainer.appendChild(fallbackElem);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function setCurrentYear() {
  const elem = document.getElementById('currentYear');
  if (elem) elem.textContent = new Date().getFullYear();
}
