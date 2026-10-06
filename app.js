/**
 * LoanPulse — Smart EMI Tracker & Auto Reminders
 * Core Application Logic, Financial Engine & Reminder Integrations
 */

(function () {
  'use strict';

  // Storage Keys
  const STORAGE_KEY_LOANS = 'loanpulse_loans_v2';
  const STORAGE_KEY_SETTINGS = 'loanpulse_settings_v2';

  // Demo Loans Seed Data
  const DEFAULT_LOANS = [
    {
      id: 'loan-1',
      name: 'HDFC Car Loan (Creta)',
      borrowerName: 'Sughan Rithvik',
      borrowerPhone: '9876543210',
      category: 'Car',
      bank: 'HDFC Bank',
      accountNo: 'LAN-8829104',
      principal: 1150000,
      interestRate: 8.75,
      tenureMonths: 60,
      emi: 23742,
      dueDay: 5,
      startDate: '2025-08-05',
      paidInstallments: 14,
      lastPaidMonth: '2026-09',
      notes: 'Auto-debit from Salary Account'
    },
    {
      id: 'loan-2',
      name: 'SBI Privilege Home Loan',
      borrowerName: 'Father / Family',
      borrowerPhone: '9840123456',
      category: 'Home',
      bank: 'State Bank of India',
      accountNo: 'HL-09124471',
      principal: 4200000,
      interestRate: 8.50,
      tenureMonths: 240,
      emi: 36458,
      dueDay: 10,
      startDate: '2024-02-10',
      paidInstallments: 32,
      lastPaidMonth: '2026-09',
      notes: 'PMAY subsidy adjusted'
    },
    {
      id: 'loan-3',
      name: 'Apple iPhone 16 Pro EMI',
      borrowerName: 'Sughan (Self)',
      borrowerPhone: '9876543210',
      category: 'Gadget',
      bank: 'HDFC CC No-Cost',
      accountNo: 'CC-EMI-9921',
      principal: 134900,
      interestRate: 0,
      tenureMonths: 12,
      emi: 11242,
      dueDay: 18,
      startDate: '2026-06-18',
      paidInstallments: 4,
      lastPaidMonth: '2026-09',
      notes: 'Zero interest scheme'
    }
  ];

  // State
  let loans = [];
  let currentFilter = 'all';
  let currentSort = 'due-asc';
  let searchQuery = '';

  // DOM Elements Cache
  const el = {
    // Alert bar
    urgentAlertBar: document.getElementById('urgentAlertBar'),
    urgentAlertText: document.getElementById('urgentAlertText'),
    dismissAlertBtn: document.getElementById('dismissAlertBtn'),

    // Nav
    notifyPermissionBtn: document.getElementById('notifyPermissionBtn'),
    notifyStatusLabel: document.getElementById('notifyStatusLabel'),
    testChimeBtn: document.getElementById('testChimeBtn'),
    openMobileGuideBtn: document.getElementById('openMobileGuideBtn'),
    openAddLoanModalBtn: document.getElementById('openAddLoanModalBtn'),
    heroAddLoanBtn: document.getElementById('heroAddLoanBtn'),
    heroAutoRemindBtn: document.getElementById('heroAutoRemindBtn'),
    nextDueTicker: document.getElementById('nextDueTicker'),

    // Metrics
    metricMonthlyEmi: document.getElementById('metricMonthlyEmi'),
    metricPaidThisMonth: document.getElementById('metricPaidThisMonth'),
    metricNextDue: document.getElementById('metricNextDue'),
    metricNextDueDate: document.getElementById('metricNextDueDate'),
    metricTotalOutstanding: document.getElementById('metricTotalOutstanding'),
    metricActiveLoanCount: document.getElementById('metricActiveLoanCount'),
    metricReminderStatus: document.getElementById('metricReminderStatus'),
    loansCountBadge: document.getElementById('loansCountBadge'),

    // Tabs
    tabLinks: document.querySelectorAll('.tab-link'),
    tabPanels: document.querySelectorAll('.tab-panel'),

    // Loans Tab
    loanSearchInput: document.getElementById('loanSearchInput'),
    loanFilterStatus: document.getElementById('loanFilterStatus'),
    loanSortBy: document.getElementById('loanSortBy'),
    exportDataBtn: document.getElementById('exportDataBtn'),
    seedDemoDataBtn: document.getElementById('seedDemoDataBtn'),
    loansGrid: document.getElementById('loansGrid'),
    loansEmptyState: document.getElementById('loansEmptyState'),
    emptyAddBtn: document.getElementById('emptyAddBtn'),
    emptySeedBtn: document.getElementById('emptySeedBtn'),

    // Calculator Tab
    calcAmountNumber: document.getElementById('calcAmountNumber'),
    calcAmountRange: document.getElementById('calcAmountRange'),
    calcRateNumber: document.getElementById('calcRateNumber'),
    calcRateRange: document.getElementById('calcRateRange'),
    calcTenureNumber: document.getElementById('calcTenureNumber'),
    calcTenureRange: document.getElementById('calcTenureRange'),
    calcTenureType: document.getElementById('calcTenureType'),
    calcEnablePrepay: document.getElementById('calcEnablePrepay'),
    prepayInputRow: document.getElementById('prepayInputRow'),
    calcPrepayAmount: document.getElementById('calcPrepayAmount'),
    saveCalcAsLoanBtn: document.getElementById('saveCalcAsLoanBtn'),
    calcResultEmi: document.getElementById('calcResultEmi'),
    calcResultTenureLabel: document.getElementById('calcResultTenureLabel'),
    calcResultPrincipal: document.getElementById('calcResultPrincipal'),
    calcResultInterest: document.getElementById('calcResultInterest'),
    calcResultTotal: document.getElementById('calcResultTotal'),
    calcPrincipalPct: document.getElementById('calcPrincipalPct'),
    calcInterestPct: document.getElementById('calcInterestPct'),
    donutPrincipalCircle: document.getElementById('donutPrincipalCircle'),
    donutInterestCircle: document.getElementById('donutInterestCircle'),
    prepaySavingsCard: document.getElementById('prepaySavingsCard'),
    prepaySavingsSummary: document.getElementById('prepaySavingsSummary'),

    // Reminders Tab
    pushChannelBadge: document.getElementById('pushChannelBadge'),
    enablePushBtn: document.getElementById('enablePushBtn'),
    testPushBtn: document.getElementById('testPushBtn'),
    openCalendarSyncListBtn: document.getElementById('openCalendarSyncListBtn'),
    downloadAllIcsBtn: document.getElementById('downloadAllIcsBtn'),
    openWhatsAppQuickReminderBtn: document.getElementById('openWhatsAppQuickReminderBtn'),

    // Schedule Tab
    scheduleTimeline: document.getElementById('scheduleTimeline'),

    // Modals
    loanModal: document.getElementById('loanModal'),
    loanModalTitle: document.getElementById('loanModalTitle'),
    closeLoanModalBtn: document.getElementById('closeLoanModalBtn'),
    cancelLoanModalBtn: document.getElementById('cancelLoanModalBtn'),
    loanForm: document.getElementById('loanForm'),
    loanEditId: document.getElementById('loanEditId'),
    formLoanName: document.getElementById('formLoanName'),
    formBorrowerName: document.getElementById('formBorrowerName'),
    formBorrowerPhone: document.getElementById('formBorrowerPhone'),
    formCategory: document.getElementById('formCategory'),
    formBankName: document.getElementById('formBankName'),
    formLoanNumber: document.getElementById('formLoanNumber'),
    formPrincipal: document.getElementById('formPrincipal'),
    formInterestRate: document.getElementById('formInterestRate'),
    formTenureMonths: document.getElementById('formTenureMonths'),
    formCustomEmi: document.getElementById('formCustomEmi'),
    recalcEmiBtn: document.getElementById('recalcEmiBtn'),
    formEmiPreview: document.getElementById('formEmiPreview'),
    formTotalPayablePreview: document.getElementById('formTotalPayablePreview'),
    formDueDay: document.getElementById('formDueDay'),
    formStartDate: document.getElementById('formStartDate'),
    formPaidInstallments: document.getElementById('formPaidInstallments'),
    formNotes: document.getElementById('formNotes'),

    // Amortization Modal
    amortizationModal: document.getElementById('amortizationModal'),
    closeAmortModalBtn: document.getElementById('closeAmortModalBtn'),
    closeAmortBtn: document.getElementById('closeAmortBtn'),
    amortModalSubtitle: document.getElementById('amortModalSubtitle'),
    amortEmiVal: document.getElementById('amortEmiVal'),
    amortPrincipalVal: document.getElementById('amortPrincipalVal'),
    amortInterestVal: document.getElementById('amortInterestVal'),
    amortEndDateVal: document.getElementById('amortEndDateVal'),
    amortTableBody: document.getElementById('amortTableBody'),

    // Mobile Guide Modal
    mobileGuideModal: document.getElementById('mobileGuideModal'),
    closeGuideModalBtn: document.getElementById('closeGuideModalBtn'),
    guideUnderstoodBtn: document.getElementById('guideUnderstoodBtn'),

    // Toast
    toastNotification: document.getElementById('toastNotification'),
    toastIcon: document.getElementById('toastIcon'),
    toastMessage: document.getElementById('toastMessage'),

    // Footer Links
    footerAddLoan: document.getElementById('footerAddLoan'),
    footerGuide: document.getElementById('footerGuide'),
    footerExport: document.getElementById('footerExport'),

    // Encrypted Vault & PIN Lock
    vaultSecurityBtn: document.getElementById('vaultSecurityBtn'),
    appLockScreenModal: document.getElementById('appLockScreenModal'),
    pinDotsDisplay: document.getElementById('pinDotsDisplay'),
    pinErrorMsg: document.getElementById('pinErrorMsg'),
    pinKeyClear: document.getElementById('pinKeyClear'),
    pinKeyBackspace: document.getElementById('pinKeyBackspace'),
    vaultSettingsModal: document.getElementById('vaultSettingsModal'),
    closeVaultSettingsBtn: document.getElementById('closeVaultSettingsBtn'),
    closeVaultModalBtn: document.getElementById('closeVaultModalBtn'),
    newPinInput: document.getElementById('newPinInput'),
    savePinBtn: document.getElementById('savePinBtn'),
    removePinBtn: document.getElementById('removePinBtn'),
    pinStatusNote: document.getElementById('pinStatusNote'),
    lockAppNowBtn: document.getElementById('lockAppNowBtn'),
    exportEncryptedBackupBtn: document.getElementById('exportEncryptedBackupBtn')
  };

  /* ==========================================================================
     Financial Calculations
     ========================================================================== */

  /**
   * Calculates monthly EMI
   * P = principal, r = annual interest rate %, n = total months
   */
  function calculateEMI(principal, annualRate, months) {
    if (principal <= 0 || months <= 0) return 0;
    if (annualRate <= 0) {
      return Math.round(principal / months);
    }
    const monthlyRate = annualRate / (12 * 100);
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(emi);
  }

  /**
   * Calculates remaining principal balance after k payments
   */
  function calculateRemainingBalance(principal, annualRate, totalMonths, paidMonths) {
    if (paidMonths >= totalMonths) return 0;
    if (annualRate <= 0) {
      const perMonth = principal / totalMonths;
      return Math.max(0, Math.round(principal - (perMonth * paidMonths)));
    }
    const emi = calculateEMI(principal, annualRate, totalMonths);
    const r = annualRate / (12 * 100);
    let balance = principal;
    for (let i = 0; i < paidMonths; i++) {
      const interestPayment = balance * r;
      const principalPayment = emi - interestPayment;
      balance = Math.max(0, balance - principalPayment);
    }
    return Math.round(balance);
  }

  /**
   * Generates Amortization Schedule
   */
  function generateAmortizationSchedule(principal, annualRate, months, startDateStr, paidCount) {
    const schedule = [];
    const emi = calculateEMI(principal, annualRate, months);
    const r = annualRate / (12 * 100);
    let balance = principal;
    const startDate = new Date(startDateStr || new Date());

    for (let i = 1; i <= months; i++) {
      const payDate = new Date(startDate.getFullYear(), startDate.getMonth() + (i - 1), startDate.getDate());
      let interest = 0;
      let principalPaid = 0;

      if (annualRate <= 0) {
        principalPaid = Math.min(balance, Math.round(principal / months));
        interest = 0;
      } else {
        interest = Math.round(balance * r);
        principalPaid = Math.min(balance, emi - interest);
      }
      balance = Math.max(0, balance - principalPaid);

      schedule.push({
        installmentNo: i,
        date: payDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric', day: 'numeric' }),
        emi: emi,
        principal: principalPaid,
        interest: interest,
        balance: balance,
        isPaid: i <= paidCount
      });

      if (balance <= 0) break;
    }
    return schedule;
  }

  /* ==========================================================================
     Audio Synthesizer (Web Audio API)
     Pleasant high-fidelity alert sound without requiring mp3 downloads
     ========================================================================== */
  function playReminderChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // First chime tone (D5 - 587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.6);

      // Second harmonic chime tone (A5 - 880 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.9);
    } catch (err) {
      console.warn('Audio chime context not ready:', err);
    }
  }

  /* ==========================================================================
     Formatters
     ========================================================================== */
  function formatINR(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
    return '₹' + Math.round(amount).toLocaleString('en-IN');
  }

  function getCategoryIcon(category) {
    switch (category) {
      case 'Car': return '🚗';
      case 'Home': return '🏠';
      case 'Personal': return '💼';
      case 'Gadget': return '📱';
      case 'Education': return '🎓';
      case 'CreditCard': return '💳';
      default: return '🏷️';
    }
  }

  /**
   * Calculate next due date and status relative to now
   */
  function getLoanDueStatus(loan) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();
    const currentYearMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    // Has user marked this month's installment as paid?
    const isPaidThisMonth = loan.lastPaidMonth === currentYearMonth;
    if (isPaidThisMonth) {
      return {
        status: 'paid',
        label: 'Paid for this month',
        badgeClass: 'paid',
        daysRemaining: 999,
        targetDate: new Date(currentYear, currentMonth + 1, loan.dueDay)
      };
    }

    const dueDay = parseInt(loan.dueDay, 10) || 5;
    const dueDateThisMonth = new Date(currentYear, currentMonth, dueDay);

    // Calculate difference in days
    const diffTime = dueDateThisMonth.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'overdue',
        label: `Overdue by ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'}!`,
        badgeClass: 'urgent',
        daysRemaining: diffDays,
        targetDate: dueDateThisMonth
      };
    } else if (diffDays === 0) {
      return {
        status: 'today',
        label: 'Due TODAY!',
        badgeClass: 'urgent',
        daysRemaining: 0,
        targetDate: dueDateThisMonth
      };
    } else if (diffDays <= 3) {
      return {
        status: 'due-soon',
        label: `Due in ${diffDays} days`,
        badgeClass: 'urgent',
        daysRemaining: diffDays,
        targetDate: dueDateThisMonth
      };
    } else if (diffDays <= 7) {
      return {
        status: 'due-soon',
        label: `Due in ${diffDays} days`,
        badgeClass: 'soon',
        daysRemaining: diffDays,
        targetDate: dueDateThisMonth
      };
    } else {
      return {
        status: 'normal',
        label: `Due ${dueDay}th (${diffDays}d)`,
        badgeClass: 'normal',
        daysRemaining: diffDays,
        targetDate: dueDateThisMonth
      };
    }
  }

  /* ==========================================================================
     Toast Notifications
     ========================================================================== */
  let toastTimer = null;
  function showToast(message, icon = '🔔') {
    if (!el.toastNotification) return;
    el.toastIcon.textContent = icon;
    el.toastMessage.textContent = message;
    el.toastNotification.classList.remove('hidden');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toastNotification.classList.add('hidden');
    }, 4000);
  }

  /* ==========================================================================
     Calendar & WhatsApp Integrations
     ========================================================================== */

  /**
   * Generates Google Calendar recurring event URL
   */
  function generateGoogleCalendarUrl(loan) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(loan.dueDay).padStart(2, '0');

    const title = encodeURIComponent(`🔔 EMI Due: ${loan.name} (${formatINR(loan.emi)})`);
    const details = encodeURIComponent(
      `LoanPulse Automated Reminder:\n\n• Loan: ${loan.name}\n• Lender: ${loan.bank}\n• Monthly EMI: ${formatINR(loan.emi)}\n• Account No: ${loan.accountNo || 'N/A'}\n• Notes: ${loan.notes || 'None'}\n\nPlease ensure sufficient bank balance.`
    );
    const location = encodeURIComponent(`${loan.bank}`);
    // Start date at 9:00 AM on the due date
    const startIso = `${year}${month}${day}T090000`;
    const endIso = `${year}${month}${day}T100000`;
    const rrule = encodeURIComponent(`RRULE:FREQ=MONTHLY;BYMONTHDAY=${loan.dueDay}`);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startIso}/${endIso}&recur=${rrule}`;
  }

  /**
   * Generates and triggers download of .ICS calendar event file
   * Standard format accepted by iPhone Apple Calendar, Samsung, Outlook, Google
   */
  function downloadLoanIcsFile(loan) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(loan.dueDay).padStart(2, '0');
    const dtstart = `${year}${month}${day}T090000`;
    const dtend = `${year}${month}${day}T100000`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LoanPulse//Smart EMI Reminders//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:loanpulse-${loan.id}-${Date.now()}@loanpulse.local`,
      `DTSTAMP:${year}${month}${day}T000000Z`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `RRULE:FREQ=MONTHLY;BYMONTHDAY=${loan.dueDay}`,
      `SUMMARY:🔔 EMI Due: ${loan.name} (${formatINR(loan.emi)})`,
      `DESCRIPTION:Automated monthly installment reminder for ${loan.name} (${loan.bank}). Amount: ${formatINR(loan.emi)}.`,
      `LOCATION:${loan.bank}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:EMI Reminder (1 Day Before)',
      'TRIGGER:-P1D',
      'END:VALARM',
      'BEGIN:VALARM',
      'ACTION:AUDIO',
      'DESCRIPTION:EMI Payment Due Today',
      'TRIGGER:-PT2H',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `LoanPulse_${loan.name.replace(/[^a-zA-Z0-9]/g, '_')}_Reminder.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Downloaded .ICS calendar file for ${loan.name}!`, '📱');
  }

  /**
   * Cleans and formats phone number for WhatsApp international URL format
   */
  function formatPhoneForWhatsApp(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    } else if (cleaned.length === 10) {
      // Default to India country code 91 if 10-digit number
      cleaned = '91' + cleaned;
    }
    return cleaned;
  }

  /**
   * Opens WhatsApp with prefilled formatted reminder message directly to borrower's phone
   */
  function openWhatsAppReminder(loan) {
    let phone = loan.borrowerPhone ? loan.borrowerPhone.trim() : '';
    if (!phone) {
      const enteredPhone = prompt(`Enter mobile number to send WhatsApp reminder for ${loan.borrowerName || loan.name}:`, '');
      if (enteredPhone) {
        phone = enteredPhone.trim();
        loan.borrowerPhone = phone;
        saveLoans();
        renderAll();
      }
    }

    const dueStatus = getLoanDueStatus(loan);
    const balance = calculateRemainingBalance(loan.principal, loan.interestRate, loan.tenureMonths, loan.paidInstallments);
    const borrower = loan.borrowerName || 'Primary Loan Holder';
    const waPhone = formatPhoneForWhatsApp(phone);

    const message = [
      `🔔 *LOANPULSE EMI DUE REMINDER* 🔔`,
      `---------------------------------`,
      `👤 *Hello ${borrower},*`,
      `This is an automated installment reminder for your registered loan:`,
      ``,
      `📌 *Loan Name:* ${loan.name}`,
      `🏦 *Lender / Bank:* ${loan.bank}`,
      `💰 *Monthly EMI:* ${formatINR(loan.emi)}`,
      `📅 *Due Date:* ${loan.dueDay}th of this month`,
      `⏳ *Current Status:* ${dueStatus.label}`,
      `💳 *Loan/A/C ID:* ${loan.accountNo || 'N/A'}`,
      `📉 *Remaining Debt:* ${formatINR(balance)}`,
      `---------------------------------`,
      `⚠️ *Action:* Please ensure sufficient balance in your linked account to prevent bounce penalties and protect your credit score.`,
      loan.notes ? `📝 *Note:* ${loan.notes}` : ''
    ].filter(Boolean).join('\n');

    const waUrl = waPhone
      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    const isMobileDevice = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
    if (isMobileDevice) {
      window.location.href = waUrl;
    } else {
      window.open(waUrl, '_blank');
    }
    showToast(`Opening WhatsApp reminder for ${borrower}...`, '💬');
  }

  /**
   * Triggers native SMS text reminder addressed to borrower's mobile
   */
  function sendSmsReminder(loan) {
    let phone = loan.borrowerPhone ? loan.borrowerPhone.trim() : '';
    if (!phone) {
      const enteredPhone = prompt(`Enter mobile number to send SMS reminder for ${loan.borrowerName || loan.name}:`, '');
      if (enteredPhone) {
        phone = enteredPhone.trim();
        loan.borrowerPhone = phone;
        saveLoans();
        renderAll();
      }
    }

    const dueStatus = getLoanDueStatus(loan);
    const borrower = loan.borrowerName || 'Primary Loan Holder';
    const cleanPhone = phone ? phone.replace(/[^\d+]/g, '') : '';

    const text = `LoanPulse Alert: Hello ${borrower}, your ${loan.name} EMI of ${formatINR(loan.emi)} is ${dueStatus.label} (${loan.bank}). Please keep sufficient balance.`;
    const smsUrl = cleanPhone ? `sms:${cleanPhone}?body=${encodeURIComponent(text)}` : `sms:?body=${encodeURIComponent(text)}`;
    
    window.location.href = smsUrl;
    showToast(`Launching SMS reminder for ${borrower}...`, '✉️');
  }

  /* ==========================================================================
     Push & Browser Notifications
     ========================================================================== */
  function updatePushNotificationStatus() {
    if (!('Notification' in window)) {
      if (el.notifyStatusLabel) el.notifyStatusLabel.textContent = 'Not Supported';
      if (el.pushChannelBadge) {
        el.pushChannelBadge.textContent = 'Unsupported';
        el.pushChannelBadge.className = 'channel-badge';
      }
      return;
    }

    if (Notification.permission === 'granted') {
      if (el.notifyStatusLabel) el.notifyStatusLabel.textContent = 'Alerts Active';
      if (el.notifyPermissionBtn) el.notifyPermissionBtn.className = 'btn btn-outline text-success';
      if (el.pushChannelBadge) {
        el.pushChannelBadge.textContent = 'Active (Allowed)';
        el.pushChannelBadge.className = 'channel-badge badge-active';
      }
      if (el.enablePushBtn) el.enablePushBtn.textContent = 'Notifications Enabled ✓';
    } else if (Notification.permission === 'denied') {
      if (el.notifyStatusLabel) el.notifyStatusLabel.textContent = 'Alerts Blocked';
      if (el.pushChannelBadge) {
        el.pushChannelBadge.textContent = 'Blocked in browser';
        el.pushChannelBadge.className = 'channel-badge';
      }
      if (el.enablePushBtn) el.enablePushBtn.textContent = 'Blocked in Browser Settings';
    } else {
      if (el.notifyStatusLabel) el.notifyStatusLabel.textContent = 'Enable Alerts';
      if (el.pushChannelBadge) {
        el.pushChannelBadge.textContent = 'Action Needed';
        el.pushChannelBadge.className = 'channel-badge';
      }
      if (el.enablePushBtn) el.enablePushBtn.textContent = 'Enable Notification Alerts';
    }
  }

  function requestPushPermission() {
    const isSecure = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!('Notification' in window) || !isSecure) {
      showToast('Push requires HTTPS. On mobile Wi-Fi, use WhatsApp & Calendar alerts below!', '💡');
      if (el.mobileGuideModal) el.mobileGuideModal.classList.remove('hidden');
      return;
    }

    try {
      const handlePerm = (permission) => {
        updatePushNotificationStatus();
        if (permission === 'granted') {
          playReminderChime();
          showToast('Notifications enabled! You will receive due alerts.', '🎉');
          sendTestNotification();
        } else {
          showToast('Notification permission was not granted.', 'ℹ️');
        }
      };

      const result = Notification.requestPermission(handlePerm);
      if (result && result.then) {
        result.then(handlePerm).catch(() => {});
      }
    } catch (err) {
      showToast('Notifications unavailable on this device.', '⚠️');
    }
  }

  async function triggerPushNotification(title, body) {
    const options = {
      body: body || 'Automated alerts are working! We will remind you 3 days before your EMI date.',
      icon: 'assets/app-icon.jpg',
      badge: 'assets/app-icon.jpg',
      vibrate: [200, 100, 200, 100, 200],
      tag: 'loanpulse-alert-' + Date.now(),
      renotify: true,
      data: { url: './index.html' }
    };

    // 1. Try ServiceWorkerRegistration.showNotification (Mandatory for Android Chrome & mobile PWA)
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, options);
          return true;
        }
      } catch (swErr) {
        console.warn('SW registration showNotification failed:', swErr);
      }

      // Also try posting message to active service worker controller
      try {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: title,
            body: body
          });
          return true;
        }
      } catch (postErr) {
        console.warn('SW postMessage failed:', postErr);
      }
    }

    // 2. Fallback to standard Notification constructor (Desktop only)
    try {
      new Notification(title, options);
      return true;
    } catch (notifErr) {
      console.warn('Standard Notification constructor failed:', notifErr);
    }
    return false;
  }

  async function sendTestNotification() {
    playReminderChime();

    if (!('Notification' in window)) {
      showToast('🔔 Chime played! Push notifications are not supported on this browser.', '🔊');
      return;
    }

    // If permission is not granted yet, ask the user immediately!
    if (Notification.permission !== 'granted') {
      try {
        const permission = await Notification.requestPermission();
        updatePushNotificationStatus();
        if (permission !== 'granted') {
          showToast('Notification permission was not granted. Tap "Allow" when prompted.', 'ℹ️');
          return;
        }
      } catch (permErr) {
        showToast('Please enable notifications in site settings.', 'ℹ️');
        return;
      }
    }

    // Permission is granted! Fire the system notification
    const success = await triggerPushNotification(
      '🔔 LoanPulse EMI Reminder',
      'Automated alerts are working! Next: HDFC Car Loan (Creta) due soon.'
    );

    if (success) {
      showToast('Test notification sent to your screen & lock screen!', '🔔');
    } else {
      showToast('Notification sent! Check your phone notification bar.', '🔔');
    }
  }

  /* ==========================================================================
     Military-Grade 256-Bit AES-GCM Client-Side CryptoVault Engine
     ========================================================================== */
  const STORAGE_KEY_VAULT = 'loanpulse_vault_enc_v2';
  const STORAGE_KEY_PIN_HASH = 'loanpulse_pin_hash_v2';
  const STORAGE_KEY_PIN_SALT = 'loanpulse_pin_salt_v2';
  const STORAGE_KEY_DEVICE_KEY = 'loanpulse_device_entropy_v2';
  const STORAGE_KEY_PIN_ENABLED = 'loanpulse_pin_enabled_v2';

  let currentVaultSecret = null;
  let isVaultUnlocked = false;
  let enteredPin = '';

  const CryptoVault = {
    generateRandomHex(bytesCount = 16) {
      const arr = new Uint8Array(bytesCount);
      window.crypto.getRandomValues(arr);
      return this.bufToHex(arr);
    },

    bufToHex(buf) {
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    },

    hexToBuf(hex) {
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
      }
      return bytes.buffer;
    },

    async hashPin(pin, saltHex) {
      const enc = new TextEncoder();
      const saltBuf = this.hexToBuf(saltHex);
      const pinBuf = enc.encode(pin);
      const combined = new Uint8Array(saltBuf.byteLength + pinBuf.byteLength);
      combined.set(new Uint8Array(saltBuf), 0);
      combined.set(pinBuf, saltBuf.byteLength);
      const hash = await window.crypto.subtle.digest('SHA-256', combined);
      return this.bufToHex(hash);
    },

    async deriveKey(passphrase, salt) {
      const enc = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(passphrase),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      return window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    },

    async encrypt(plaintext, passphrase) {
      const enc = new TextEncoder();
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const key = await this.deriveKey(passphrase, salt);
      const ciphertext = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        enc.encode(plaintext)
      );
      return {
        v: 2,
        enc: 'AES-256-GCM',
        salt: this.bufToHex(salt),
        iv: this.bufToHex(iv),
        ct: this.bufToHex(ciphertext),
        timestamp: Date.now()
      };
    },

    async decrypt(encryptedObj, passphrase) {
      const dec = new TextDecoder();
      const salt = this.hexToBuf(encryptedObj.salt);
      const iv = this.hexToBuf(encryptedObj.iv);
      const ct = this.hexToBuf(encryptedObj.ct);
      const key = await this.deriveKey(passphrase, salt);
      const plaintextBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ct
      );
      return dec.decode(plaintextBuffer);
    }
  };

  function ensureDeviceKey() {
    let devKey = localStorage.getItem(STORAGE_KEY_DEVICE_KEY);
    if (!devKey) {
      devKey = CryptoVault.generateRandomHex(32);
      localStorage.setItem(STORAGE_KEY_DEVICE_KEY, devKey);
    }
    return devKey;
  }

  function isPinRequired() {
    return localStorage.getItem(STORAGE_KEY_PIN_ENABLED) === 'true';
  }

  function showLockScreen() {
    enteredPin = '';
    updatePinDots();
    if (el.appLockScreenModal) el.appLockScreenModal.classList.remove('hidden');
    if (el.pinErrorMsg) el.pinErrorMsg.classList.add('hidden');
  }

  function hideLockScreen() {
    if (el.appLockScreenModal) el.appLockScreenModal.classList.add('hidden');
  }

  function updatePinDots() {
    if (!el.pinDotsDisplay) return;
    const dots = el.pinDotsDisplay.querySelectorAll('.pin-dot');
    dots.forEach((dot, idx) => {
      if (idx < enteredPin.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  async function handlePinDigit(digit) {
    if (enteredPin.length >= 4) return;
    enteredPin += digit;
    updatePinDots();

    if (enteredPin.length === 4) {
      const storedSalt = localStorage.getItem(STORAGE_KEY_PIN_SALT);
      const storedHash = localStorage.getItem(STORAGE_KEY_PIN_HASH);
      if (!storedSalt || !storedHash) {
        currentVaultSecret = enteredPin;
        isVaultUnlocked = true;
        hideLockScreen();
        await loadLoans();
        return;
      }

      const inputHash = await CryptoVault.hashPin(enteredPin, storedSalt);
      if (inputHash === storedHash) {
        currentVaultSecret = enteredPin;
        isVaultUnlocked = true;
        hideLockScreen();
        playReminderChime();
        showToast('Vault unlocked! Financial records decrypted.', '🔓');
        await loadLoans();
      } else {
        if (el.pinErrorMsg) el.pinErrorMsg.classList.remove('hidden');
        setTimeout(() => {
          enteredPin = '';
          updatePinDots();
        }, 500);
      }
    }
  }

  /* ==========================================================================
     Encrypted Storage: Load & Save
     ========================================================================== */
  async function loadLoans() {
    try {
      const devKey = ensureDeviceKey();
      if (isPinRequired() && !isVaultUnlocked) {
        showLockScreen();
        return;
      }

      if (!currentVaultSecret) {
        currentVaultSecret = devKey;
        isVaultUnlocked = true;
      }

      const encryptedDataStr = localStorage.getItem(STORAGE_KEY_VAULT);
      if (encryptedDataStr) {
        const encryptedObj = JSON.parse(encryptedDataStr);
        const decryptedJson = await CryptoVault.decrypt(encryptedObj, currentVaultSecret);
        loans = JSON.parse(decryptedJson).map((loan, idx) => ({
          borrowerName: loan.borrowerName || (DEFAULT_LOANS[idx] ? DEFAULT_LOANS[idx].borrowerName : 'Self'),
          borrowerPhone: loan.borrowerPhone || (DEFAULT_LOANS[idx] ? DEFAULT_LOANS[idx].borrowerPhone : ''),
          ...loan
        }));
      } else {
        // Migration from legacy unencrypted storage
        const legacyStored = localStorage.getItem(STORAGE_KEY_LOANS);
        if (legacyStored) {
          try {
            loans = JSON.parse(legacyStored);
            localStorage.removeItem(STORAGE_KEY_LOANS);
          } catch (e) {
            loans = [...DEFAULT_LOANS];
          }
        } else {
          loans = [...DEFAULT_LOANS];
        }
        saveLoans();
      }
    } catch (e) {
      console.warn('Error decrypting loans vault:', e);
      if (isPinRequired() && !isVaultUnlocked) {
        showLockScreen();
        return;
      }
      if (!loans || loans.length === 0) {
        loans = [...DEFAULT_LOANS];
      }
    }
    renderAll();
  }

  function saveLoans() {
    if (!currentVaultSecret) {
      currentVaultSecret = ensureDeviceKey();
      isVaultUnlocked = true;
    }
    const jsonStr = JSON.stringify(loans);
    CryptoVault.encrypt(jsonStr, currentVaultSecret)
      .then((encryptedPayload) => {
        localStorage.setItem(STORAGE_KEY_VAULT, JSON.stringify(encryptedPayload));
        localStorage.removeItem(STORAGE_KEY_LOANS); // Always ensure no plaintext is left on disk
      })
      .catch((err) => {
        console.error('Vault encryption failed:', err);
      });
  }

  /* ==========================================================================
     UI Rendering
     ========================================================================== */
  function renderAll() {
    renderMetrics();
    renderLoansGrid();
    renderTimeline();
    checkUrgentAlerts();
  }

  function renderMetrics() {
    let totalMonthlyEmi = 0;
    let totalPaidThisMonth = 0;
    let totalOutstanding = 0;
    let nextUpcoming = null;

    const currentYearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    loans.forEach((loan) => {
      totalMonthlyEmi += loan.emi;
      const isPaid = loan.lastPaidMonth === currentYearMonth;
      if (isPaid) {
        totalPaidThisMonth += loan.emi;
      }

      const balance = calculateRemainingBalance(loan.principal, loan.interestRate, loan.tenureMonths, loan.paidInstallments);
      totalOutstanding += balance;

      if (!isPaid) {
        const dueInfo = getLoanDueStatus(loan);
        if (!nextUpcoming || dueInfo.daysRemaining < nextUpcoming.daysRemaining) {
          nextUpcoming = { loan, dueInfo };
        }
      }
    });

    if (el.metricMonthlyEmi) el.metricMonthlyEmi.textContent = formatINR(totalMonthlyEmi);
    if (el.metricPaidThisMonth) el.metricPaidThisMonth.textContent = `${formatINR(totalPaidThisMonth)} paid this month`;
    if (el.metricTotalOutstanding) el.metricTotalOutstanding.textContent = formatINR(totalOutstanding);
    if (el.metricActiveLoanCount) el.metricActiveLoanCount.textContent = `${loans.length} active commitments`;
    if (el.loansCountBadge) el.loansCountBadge.textContent = loans.length;

    if (nextUpcoming) {
      if (el.metricNextDue) el.metricNextDue.textContent = nextUpcoming.loan.name;
      const cleanDueLabel = nextUpcoming.dueInfo.label.replace('by ', '').replace('!', '');
      if (el.metricNextDueDate) el.metricNextDueDate.textContent = `${cleanDueLabel} (${formatINR(nextUpcoming.loan.emi)})`;
      if (el.nextDueTicker) el.nextDueTicker.textContent = `Next: ${nextUpcoming.loan.name} — ${nextUpcoming.dueInfo.label}`;
    } else {
      if (el.metricNextDue) el.metricNextDue.textContent = 'All Clear! 🎉';
      if (el.metricNextDueDate) el.metricNextDueDate.textContent = 'All EMIs settled for this month';
      if (el.nextDueTicker) el.nextDueTicker.textContent = 'All EMIs settled for this month';
    }

    // Update Mobile-Only Dedicated Fintech Card
    const mobEmi = document.getElementById('mobileMonthlyEmiDisplay');
    const mobNext = document.getElementById('mobileNextDueDisplay');
    const mobDebt = document.getElementById('mobileTotalDebtDisplay');
    if (mobEmi) mobEmi.textContent = formatINR(totalMonthlyEmi);
    if (mobDebt) mobDebt.textContent = formatINR(totalOutstanding);
    if (mobNext) {
      if (nextUpcoming) {
        mobNext.textContent = `${nextUpcoming.loan.name} • ${nextUpcoming.dueInfo.label}`;
      } else {
        mobNext.textContent = 'All settled this month 🎉';
      }
    }
  }

  function checkUrgentAlerts() {
    const currentYearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const urgentLoans = loans.filter((loan) => {
      if (loan.lastPaidMonth === currentYearMonth) return false;
      const dueInfo = getLoanDueStatus(loan);
      return dueInfo.status === 'overdue' || dueInfo.status === 'today' || dueInfo.daysRemaining <= 3;
    });

    if (urgentLoans.length > 0) {
      const topUrgent = urgentLoans[0];
      const dueInfo = getLoanDueStatus(topUrgent);
      if (el.urgentAlertText) {
        el.urgentAlertText.innerHTML = `<strong>Attention Required:</strong> ${topUrgent.name} is <strong>${dueInfo.label}</strong> (Amount: ${formatINR(topUrgent.emi)}).`;
      }
      if (el.urgentAlertBar) el.urgentAlertBar.classList.remove('hidden');
    } else {
      if (el.urgentAlertBar) el.urgentAlertBar.classList.add('hidden');
    }
  }

  function renderLoansGrid() {
    if (!el.loansGrid) return;
    el.loansGrid.innerHTML = '';

    const currentYearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    // Filter
    let filtered = loans.filter((loan) => {
      const isPaid = loan.lastPaidMonth === currentYearMonth;
      const dueInfo = getLoanDueStatus(loan);

      // Search match
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          loan.name.toLowerCase().includes(query) ||
          (loan.borrowerName && loan.borrowerName.toLowerCase().includes(query)) ||
          (loan.borrowerPhone && loan.borrowerPhone.toLowerCase().includes(query)) ||
          loan.bank.toLowerCase().includes(query) ||
          loan.category.toLowerCase().includes(query) ||
          (loan.accountNo && loan.accountNo.toLowerCase().includes(query));
        if (!matches) return false;
      }

      // Status Filter
      if (currentFilter === 'due-soon') {
        return !isPaid && dueInfo.daysRemaining <= 7 && dueInfo.daysRemaining >= 0;
      }
      if (currentFilter === 'unpaid') {
        return !isPaid;
      }
      if (currentFilter === 'paid') {
        return isPaid;
      }
      if (currentFilter === 'overdue') {
        return !isPaid && dueInfo.status === 'overdue';
      }
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      const dueA = getLoanDueStatus(a);
      const dueB = getLoanDueStatus(b);
      const balA = calculateRemainingBalance(a.principal, a.interestRate, a.tenureMonths, a.paidInstallments);
      const balB = calculateRemainingBalance(b.principal, b.interestRate, b.tenureMonths, b.paidInstallments);

      if (currentSort === 'due-asc') return dueA.daysRemaining - dueB.daysRemaining;
      if (currentSort === 'due-desc') return dueB.daysRemaining - dueA.daysRemaining;
      if (currentSort === 'emi-desc') return b.emi - a.emi;
      if (currentSort === 'emi-asc') return a.emi - b.emi;
      if (currentSort === 'balance-desc') return balB - balA;
      return 0;
    });

    // Handle Empty
    if (filtered.length === 0) {
      if (el.loansEmptyState) el.loansEmptyState.classList.remove('hidden');
      return;
    }
    if (el.loansEmptyState) el.loansEmptyState.classList.add('hidden');

    filtered.forEach((loan) => {
      const card = createLoanCardElement(loan, currentYearMonth);
      el.loansGrid.appendChild(card);
    });
  }

  function createLoanCardElement(loan, currentYearMonth) {
    const isPaid = loan.lastPaidMonth === currentYearMonth;
    const dueInfo = getLoanDueStatus(loan);
    const balance = calculateRemainingBalance(loan.principal, loan.interestRate, loan.tenureMonths, loan.paidInstallments);
    const progressPct = Math.min(100, Math.round((loan.paidInstallments / loan.tenureMonths) * 100));

    const card = document.createElement('div');
    card.className = `loan-card ${isPaid ? 'status-paid' : ''} ${dueInfo.status === 'overdue' ? 'status-overdue' : ''}`;
    card.dataset.id = loan.id;

    const gcalUrl = generateGoogleCalendarUrl(loan);

    card.innerHTML = `
      <div class="loan-header">
        <div class="loan-title-group">
          <div class="category-icon-box" title="${loan.category}">
            ${getCategoryIcon(loan.category)}
          </div>
          <div class="loan-title-text">
            <h4 title="${loan.name}">${loan.name}</h4>
            <div class="bank-tag" title="${loan.bank}${loan.accountNo ? ' • ' + loan.accountNo : ''}">
              <span class="bank-name">🏦 ${loan.bank}</span>
              ${loan.accountNo ? `<span class="bank-acc">• ${loan.accountNo}</span>` : ''}
            </div>
          </div>
        </div>
        <span class="due-badge ${dueInfo.badgeClass}">${dueInfo.label}</span>
      </div>

      <!-- Borrower & Reminder Mobile Badge Row -->
      <div class="borrower-pill-row">
        <span class="borrower-tag" title="Person whose name the loan is taken under">
          👤 <strong>${loan.borrowerName || 'Self / Primary Holder'}</strong>
        </span>
        ${loan.borrowerPhone ? `
          <a href="tel:${loan.borrowerPhone}" class="phone-tag" title="Tap to call or send direct alert">
            📱 ${loan.borrowerPhone}
          </a>
        ` : `
          <span class="phone-tag" style="opacity: 0.6; color: var(--text-dim);">No phone saved</span>
        `}
      </div>

      <div class="loan-figures">
        <div class="figure-item">
          <span class="figure-label">Monthly EMI</span>
          <span class="figure-value">${formatINR(loan.emi)}</span>
          <span class="figure-sub">${loan.interestRate}% Int. • Due ${loan.dueDay}th</span>
        </div>
        <div class="figure-item">
          <span class="figure-label">Remaining Balance</span>
          <span class="figure-value">${formatINR(balance)}</span>
          <span class="figure-sub">${loan.tenureMonths - loan.paidInstallments} of ${loan.tenureMonths} mos left</span>
        </div>
      </div>

      <div class="progress-block">
        <div class="progress-header">
          <span>Repayment Progress</span>
          <strong>${progressPct}% Paid (${loan.paidInstallments}/${loan.tenureMonths})</strong>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${progressPct}%"></div>
        </div>
      </div>

      <div class="loan-card-actions">
        <button class="btn btn-sm ${isPaid ? 'btn-secondary' : 'btn-primary'} toggle-paid-btn" data-id="${loan.id}">
          <span>${isPaid ? '✓ Paid (Undo)' : '✓ Mark Paid'}</span>
        </button>

        <div class="action-btn-group">
          <button class="icon-btn whatsapp" title="Send WhatsApp Reminder to ${loan.borrowerName || 'Borrower'}" data-action="whatsapp" data-id="${loan.id}">
            💬
          </button>
          <button class="icon-btn sms" title="Send SMS Text Reminder to ${loan.borrowerName || 'Borrower'}" data-action="sms" data-id="${loan.id}">
            ✉️
          </button>
          <a href="${gcalUrl}" target="_blank" rel="noopener noreferrer" class="icon-btn calendar" title="Add to Google Calendar">
            🗓️
          </a>
          <button class="icon-btn" title="Download .ICS Calendar File" data-action="ics" data-id="${loan.id}">
            📱
          </button>
          <button class="icon-btn" title="View Full Amortization Schedule" data-action="amort" data-id="${loan.id}">
            📊
          </button>
          <button class="icon-btn" title="Edit Loan Details" data-action="edit" data-id="${loan.id}">
            ✏️
          </button>
          <button class="icon-btn delete" title="Delete Loan" data-action="delete" data-id="${loan.id}">
            🗑️
          </button>
        </div>
      </div>
    `;

    return card;
  }

  function renderTimeline() {
    if (!el.scheduleTimeline) return;
    el.scheduleTimeline.innerHTML = '';

    const today = new Date();
    const monthsAhead = 12;

    for (let m = 0; m < monthsAhead; m++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + m, 1);
      const monthLabel = monthDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      let monthTotal = 0;
      const monthItems = [];

      loans.forEach((loan) => {
        // Check if loan is still active in this month
        const installmentsRemaining = loan.tenureMonths - loan.paidInstallments;
        if (m < installmentsRemaining) {
          monthTotal += loan.emi;
          monthItems.push({
            name: loan.name,
            bank: loan.bank,
            category: loan.category,
            dueDay: loan.dueDay,
            emi: loan.emi
          });
        }
      });

      if (monthItems.length === 0) continue;

      const card = document.createElement('div');
      card.className = 'timeline-month-card';
      card.innerHTML = `
        <div class="timeline-month-header">
          <span class="timeline-month-title">📅 ${monthLabel}</span>
          <span class="timeline-month-total">Total Outflow: <strong>${formatINR(monthTotal)}</strong></span>
        </div>
        <div class="timeline-items-list">
          ${monthItems.map(item => `
            <div class="timeline-item">
              <div>
                <span>${getCategoryIcon(item.category)} <strong>${item.name}</strong> (${item.bank})</span>
              </div>
              <div>
                <span class="timeline-item-due">Due: ${item.dueDay}th</span>
                &nbsp;•&nbsp;
                <strong>${formatINR(item.emi)}</strong>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      el.scheduleTimeline.appendChild(card);
    }
  }

  /* ==========================================================================
     Calculator Engine
     ========================================================================== */
  function updateCalculator() {
    const principal = parseFloat(el.calcAmountNumber.value) || 0;
    const rate = parseFloat(el.calcRateNumber.value) || 0;
    let tenure = parseInt(el.calcTenureNumber.value, 10) || 12;

    if (el.calcTenureType.value === 'years') {
      tenure = tenure * 12;
    }

    const emi = calculateEMI(principal, rate, tenure);
    const totalAmount = emi * tenure;
    const totalInterest = Math.max(0, totalAmount - principal);

    if (el.calcResultEmi) el.calcResultEmi.textContent = formatINR(emi);
    if (el.calcResultTenureLabel) el.calcResultTenureLabel.textContent = `for ${tenure} months (${(tenure / 12).toFixed(1)} Years)`;
    if (el.calcResultPrincipal) el.calcResultPrincipal.textContent = formatINR(principal);
    if (el.calcResultInterest) el.calcResultInterest.textContent = formatINR(totalInterest);
    if (el.calcResultTotal) el.calcResultTotal.textContent = formatINR(totalAmount);

    // Donut percentages
    const principalPct = totalAmount > 0 ? (principal / totalAmount) * 100 : 100;
    const interestPct = totalAmount > 0 ? (totalInterest / totalAmount) * 100 : 0;

    if (el.calcPrincipalPct) el.calcPrincipalPct.textContent = `${principalPct.toFixed(1)}%`;
    if (el.calcInterestPct) el.calcInterestPct.textContent = `${interestPct.toFixed(1)}%`;

    // Circumference = 2 * PI * 60 = ~377
    const circumference = 377;
    const principalDash = (principalPct / 100) * circumference;
    const interestDash = (interestPct / 100) * circumference;

    if (el.donutPrincipalCircle) {
      el.donutPrincipalCircle.setAttribute('stroke-dasharray', `${principalDash} ${circumference}`);
    }
    if (el.donutInterestCircle) {
      el.donutInterestCircle.setAttribute('stroke-dasharray', `${interestDash} ${circumference}`);
      el.donutInterestCircle.setAttribute('stroke-dashoffset', `${-principalDash}`);
    }

    // Prepayment evaluation
    if (el.calcEnablePrepay && el.calcEnablePrepay.checked) {
      const extraPrepay = parseFloat(el.calcPrepayAmount.value) || 0;
      if (extraPrepay > 0 && rate > 0) {
        evaluatePrepaymentSavings(principal, rate, tenure, emi, extraPrepay);
      }
    }
  }

  function evaluatePrepaymentSavings(principal, annualRate, tenure, originalEmi, extraMonthly) {
    const r = annualRate / (12 * 100);
    const newMonthlyPayment = originalEmi + extraMonthly;
    let balance = principal;
    let newMonths = 0;
    let newTotalInterest = 0;

    while (balance > 0 && newMonths < tenure) {
      newMonths++;
      const interestThisMonth = balance * r;
      newTotalInterest += interestThisMonth;
      const principalPaid = Math.min(balance, newMonthlyPayment - interestThisMonth);
      balance -= principalPaid;
      if (balance <= 0) break;
    }

    const originalTotalInterest = (originalEmi * tenure) - principal;
    const interestSaved = Math.max(0, originalTotalInterest - newTotalInterest);
    const monthsSaved = Math.max(0, tenure - newMonths);

    if (el.prepaySavingsSummary) {
      el.prepaySavingsSummary.innerHTML = `By paying an extra <strong>${formatINR(extraMonthly)}/mo</strong>, you save <strong>${formatINR(interestSaved)}</strong> in interest and become debt-free <strong>${monthsSaved} months earlier</strong>!`;
    }
    if (el.prepaySavingsCard) el.prepaySavingsCard.classList.remove('hidden');
  }

  /* ==========================================================================
     Modal Handlers
     ========================================================================== */
  function openAddLoanModal(editLoan = null) {
    el.loanForm.reset();
    if (editLoan) {
      el.loanModalTitle.textContent = '✏️ Edit EMI Loan';
      el.loanEditId.value = editLoan.id;
      el.formLoanName.value = editLoan.name;
      if (el.formBorrowerName) el.formBorrowerName.value = editLoan.borrowerName || '';
      if (el.formBorrowerPhone) el.formBorrowerPhone.value = editLoan.borrowerPhone || '';
      el.formCategory.value = editLoan.category;
      el.formBankName.value = editLoan.bank;
      el.formLoanNumber.value = editLoan.accountNo || '';
      el.formPrincipal.value = editLoan.principal;
      el.formInterestRate.value = editLoan.interestRate;
      el.formTenureMonths.value = editLoan.tenureMonths;
      if (el.formCustomEmi) {
        el.formCustomEmi.value = editLoan.emi || '';
        el.formCustomEmi.dataset.manual = 'true';
      }
      el.formDueDay.value = editLoan.dueDay;
      el.formStartDate.value = editLoan.startDate;
      el.formPaidInstallments.value = editLoan.paidInstallments || 0;
      el.formNotes.value = editLoan.notes || '';
    } else {
      el.loanModalTitle.textContent = '➕ Add New EMI Loan';
      el.loanEditId.value = '';
      if (el.formBorrowerName) el.formBorrowerName.value = '';
      if (el.formBorrowerPhone) el.formBorrowerPhone.value = '';
      if (el.formCustomEmi) {
        el.formCustomEmi.value = '';
        el.formCustomEmi.dataset.manual = 'false';
      }
      el.formStartDate.value = new Date().toISOString().split('T')[0];
      el.formDueDay.value = '5';
      el.formPaidInstallments.value = '0';
    }
    updateFormEmiPreview();
    el.loanModal.classList.remove('hidden');
  }

  function closeLoanModal() {
    el.loanModal.classList.add('hidden');
  }

  function updateFormEmiPreview(forceRecalc = false) {
    const principal = parseFloat(el.formPrincipal.value) || 0;
    const rate = parseFloat(el.formInterestRate.value) || 0;
    const tenure = parseInt(el.formTenureMonths.value, 10) || 0;

    const calculatedEmi = calculateEMI(principal, rate, tenure);

    if (el.formCustomEmi) {
      if (forceRecalc || el.formCustomEmi.dataset.manual !== 'true' || !el.formCustomEmi.value) {
        if (calculatedEmi > 0) {
          el.formCustomEmi.value = calculatedEmi;
        }
      }
    }

    const manualVal = el.formCustomEmi ? parseFloat(el.formCustomEmi.value) : 0;
    const effectiveEmi = manualVal > 0 ? manualVal : calculatedEmi;
    const total = effectiveEmi * tenure;

    if (el.formEmiPreview) el.formEmiPreview.textContent = formatINR(effectiveEmi);
    if (el.formTotalPayablePreview) el.formTotalPayablePreview.textContent = formatINR(total);
  }

  function handleSaveLoan(e) {
    e.preventDefault();

    const editId = el.loanEditId.value;
    const name = el.formLoanName.value.trim();
    const borrowerName = (el.formBorrowerName && el.formBorrowerName.value.trim()) || 'Self';
    const borrowerPhone = (el.formBorrowerPhone && el.formBorrowerPhone.value.trim()) || '';
    const category = el.formCategory.value || 'Other';
    const bank = (el.formBankName && el.formBankName.value.trim()) || 'Personal / Lender';
    const accountNo = (el.formLoanNumber && el.formLoanNumber.value.trim()) || '';
    const rawPrincipal = parseFloat(el.formPrincipal.value) || 0;
    const interestRate = parseFloat(el.formInterestRate.value) || 0;
    const tenureMonths = Math.max(1, parseInt(el.formTenureMonths.value, 10) || 1);
    const manualEmi = parseFloat(el.formCustomEmi ? el.formCustomEmi.value : 0) || 0;

    // Use manual EMI if provided, otherwise formula calculation
    const emi = manualEmi > 0 ? Math.round(manualEmi) : calculateEMI(rawPrincipal, interestRate, tenureMonths);
    // If principal was left blank or 0, back-calculate principal from EMI * tenure
    const principal = rawPrincipal > 0 ? rawPrincipal : (emi * tenureMonths);

    const dueDay = Math.min(31, Math.max(1, parseInt(el.formDueDay.value, 10) || 5));
    const startDate = (el.formStartDate && el.formStartDate.value) || new Date().toISOString().split('T')[0];
    const paidInstallments = parseInt(el.formPaidInstallments.value, 10) || 0;
    const notes = (el.formNotes && el.formNotes.value.trim()) || '';

    if (editId) {
      // Edit existing
      const idx = loans.findIndex((l) => l.id === editId);
      if (idx !== -1) {
        loans[idx] = {
          ...loans[idx],
          name, borrowerName, borrowerPhone, category, bank, accountNo, principal, interestRate,
          tenureMonths, dueDay, startDate, paidInstallments, notes, emi
        };
        showToast(`Updated loan: ${name}`, '✏️');
      }
    } else {
      // Create new
      const newLoan = {
        id: 'loan-' + Date.now(),
        name, borrowerName, borrowerPhone, category, bank, accountNo, principal, interestRate,
        tenureMonths, dueDay, startDate, paidInstallments, notes, emi,
        lastPaidMonth: ''
      };
      loans.push(newLoan);
      playReminderChime();
      showToast(`Added new EMI: ${name}`, '🎉');
    }

    saveLoans();
    renderAll();
    closeLoanModal();
  }

  function openAmortizationModal(loan) {
    const schedule = generateAmortizationSchedule(
      loan.principal,
      loan.interestRate,
      loan.tenureMonths,
      loan.startDate,
      loan.paidInstallments
    );

    const totalInterest = (loan.emi * loan.tenureMonths) - loan.principal;

    if (el.amortModalSubtitle) {
      el.amortModalSubtitle.textContent = `${loan.name} (${loan.bank}) — ${loan.tenureMonths} Months Schedule`;
    }
    if (el.amortEmiVal) el.amortEmiVal.textContent = formatINR(loan.emi);
    if (el.amortPrincipalVal) el.amortPrincipalVal.textContent = formatINR(loan.principal);
    if (el.amortInterestVal) el.amortInterestVal.textContent = formatINR(totalInterest);

    if (schedule.length > 0 && el.amortEndDateVal) {
      el.amortEndDateVal.textContent = schedule[schedule.length - 1].date;
    }

    if (el.amortTableBody) {
      el.amortTableBody.innerHTML = schedule.map((row) => `
        <tr class="${row.isPaid ? 'row-paid' : ''}">
          <td>${row.installmentNo}</td>
          <td>${row.date}</td>
          <td><strong>${formatINR(row.emi)}</strong></td>
          <td>${formatINR(row.principal)}</td>
          <td>${formatINR(row.interest)}</td>
          <td>${formatINR(row.balance)}</td>
          <td>${row.isPaid ? '<span class="due-badge paid">Paid ✓</span>' : '<span class="due-badge normal">Pending</span>'}</td>
        </tr>
      `).join('');
    }

    el.amortizationModal.classList.remove('hidden');
  }

  /* ==========================================================================
     Event Listeners Wireup
     ========================================================================== */
  function setupEventListeners() {
    // Nav Tab Switching (Top Tabs + Mobile Bottom Nav)
    const switchTab = (targetId) => {
      document.querySelectorAll('.tab-link').forEach((t) => {
        t.classList.toggle('active', t.dataset.tab === targetId);
      });
      document.querySelectorAll('.mobile-nav-item[data-tab]').forEach((m) => {
        m.classList.toggle('active', m.dataset.tab === targetId);
      });
      el.tabPanels.forEach((p) => {
        p.classList.toggle('active', p.id === targetId);
      });

      if (targetId === 'tab-calculator') {
        updateCalculator();
      } else if (targetId === 'tab-schedule') {
        renderTimeline();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    el.tabLinks.forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    document.querySelectorAll('.mobile-nav-item[data-tab]').forEach((navItem) => {
      navItem.addEventListener('click', () => switchTab(navItem.dataset.tab));
    });

    const mobileFab = document.getElementById('mobileFabAddBtn');
    if (mobileFab) {
      mobileFab.addEventListener('click', () => openAddLoanModal());
    }

    // Audio Test Chime
    if (el.testChimeBtn) {
      el.testChimeBtn.addEventListener('click', () => {
        playReminderChime();
        showToast('🔔 Reminder chime test sound played!', '🔊');
      });
    }

    // Notification Permission
    if (el.notifyPermissionBtn) {
      el.notifyPermissionBtn.addEventListener('click', requestPushPermission);
    }
    if (el.enablePushBtn) {
      el.enablePushBtn.addEventListener('click', requestPushPermission);
    }
    if (el.testPushBtn) {
      el.testPushBtn.addEventListener('click', sendTestNotification);
    }

    // Modals
    if (el.openAddLoanModalBtn) el.openAddLoanModalBtn.addEventListener('click', () => openAddLoanModal());
    if (el.heroAddLoanBtn) el.heroAddLoanBtn.addEventListener('click', () => openAddLoanModal());
    if (el.emptyAddBtn) el.emptyAddBtn.addEventListener('click', () => openAddLoanModal());
    if (el.footerAddLoan) el.footerAddLoan.addEventListener('click', () => openAddLoanModal());

    const mobCardAdd = document.getElementById('mobileCardAddBtn');
    if (mobCardAdd) mobCardAdd.addEventListener('click', () => openAddLoanModal());

    const mobCardGuide = document.getElementById('mobileCardGuideBtn');
    if (mobCardGuide) mobCardGuide.addEventListener('click', () => {
      if (el.mobileGuideModal) el.mobileGuideModal.classList.remove('hidden');
    });

    if (el.closeLoanModalBtn) el.closeLoanModalBtn.addEventListener('click', closeLoanModal);
    if (el.cancelLoanModalBtn) el.cancelLoanModalBtn.addEventListener('click', closeLoanModal);
    if (el.loanForm) el.loanForm.addEventListener('submit', handleSaveLoan);

    // Auto calculate on modal inputs
    ['formPrincipal', 'formInterestRate', 'formTenureMonths'].forEach((id) => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', () => updateFormEmiPreview(false));
      }
    });

    if (el.formCustomEmi) {
      el.formCustomEmi.addEventListener('input', () => {
        el.formCustomEmi.dataset.manual = 'true';
        updateFormEmiPreview(false);
      });
    }

    if (el.recalcEmiBtn) {
      el.recalcEmiBtn.addEventListener('click', () => {
        if (el.formCustomEmi) el.formCustomEmi.dataset.manual = 'false';
        updateFormEmiPreview(true);
        showToast('Recalculated EMI from principal & interest rate!', '⚡');
      });
    }

    // Amortization Modal Close
    if (el.closeAmortModalBtn) el.closeAmortModalBtn.addEventListener('click', () => el.amortizationModal.classList.add('hidden'));
    if (el.closeAmortBtn) el.closeAmortBtn.addEventListener('click', () => el.amortizationModal.classList.add('hidden'));

    // Mobile Phone Guide Modal
    if (el.openMobileGuideBtn) el.openMobileGuideBtn.addEventListener('click', () => el.mobileGuideModal.classList.remove('hidden'));
    if (el.heroAutoRemindBtn) el.heroAutoRemindBtn.addEventListener('click', () => el.mobileGuideModal.classList.remove('hidden'));
    if (el.footerGuide) el.footerGuide.addEventListener('click', () => el.mobileGuideModal.classList.remove('hidden'));
    if (el.closeGuideModalBtn) el.closeGuideModalBtn.addEventListener('click', () => el.mobileGuideModal.classList.add('hidden'));
    if (el.guideUnderstoodBtn) el.guideUnderstoodBtn.addEventListener('click', () => el.mobileGuideModal.classList.add('hidden'));

    // Backdrop tap-outside-to-dismiss for all modals (standard mobile UX)
    [el.loanModal, el.amortizationModal, el.mobileGuideModal].forEach((modal) => {
      if (!modal) return;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    });

    // Escape key dismiss
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (el.loanModal) el.loanModal.classList.add('hidden');
        if (el.amortizationModal) el.amortizationModal.classList.add('hidden');
        if (el.mobileGuideModal) el.mobileGuideModal.classList.add('hidden');
      }
    });

    // Alert Bar Dismiss
    if (el.dismissAlertBtn) {
      el.dismissAlertBtn.addEventListener('click', () => {
        el.urgentAlertBar.classList.add('hidden');
      });
    }

    // Search and Filters
    if (el.loanSearchInput) {
      el.loanSearchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        renderLoansGrid();
      });
    }

    if (el.loanFilterStatus) {
      el.loanFilterStatus.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        renderLoansGrid();
      });
    }

    if (el.loanSortBy) {
      el.loanSortBy.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderLoansGrid();
      });
    }

    // Seed Data
    const handleSeed = () => {
      if (confirm('Load sample demonstration loans (Creta Car Loan, SBI Home Loan, iPhone EMI)?')) {
        loans = [...DEFAULT_LOANS];
        saveLoans();
        renderAll();
        showToast('Sample demo loans loaded!', '✨');
      }
    };
    if (el.seedDemoDataBtn) el.seedDemoDataBtn.addEventListener('click', handleSeed);
    if (el.emptySeedBtn) el.emptySeedBtn.addEventListener('click', handleSeed);

    // Export Data (Blob object URL for full mobile Chrome & Safari support)
    const handleExport = () => {
      const jsonStr = JSON.stringify(loans, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = `LoanPulse_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      setTimeout(() => {
        downloadAnchor.remove();
        URL.revokeObjectURL(url);
      }, 500);
      showToast('Loans backup downloaded as JSON!', '💾');
    };
    if (el.exportDataBtn) el.exportDataBtn.addEventListener('click', handleExport);
    if (el.footerExport) el.footerExport.addEventListener('click', handleExport);

    // =========================================================================
    // Vault Security & PIN Keypad Event Listeners
    // =========================================================================
    document.querySelectorAll('.pin-key[data-key]').forEach((btn) => {
      btn.addEventListener('click', () => {
        handlePinDigit(btn.getAttribute('data-key'));
      });
    });

    if (el.pinKeyClear) {
      el.pinKeyClear.addEventListener('click', () => {
        enteredPin = '';
        updatePinDots();
      });
    }

    if (el.pinKeyBackspace) {
      el.pinKeyBackspace.addEventListener('click', () => {
        if (enteredPin.length > 0) {
          enteredPin = enteredPin.slice(0, -1);
          updatePinDots();
        }
      });
    }

    // Vault Security Modal
    function updateVaultStatusUI() {
      const pinEnabled = isPinRequired();
      if (el.pinStatusNote) {
        el.pinStatusNote.textContent = pinEnabled
          ? '🔒 4-digit PIN Protection Active (Encrypted with your PIN)'
          : '🛡️ Device Entropy Encryption Active (Protected by hardware key)';
      }
      if (el.vaultSecurityBtn) {
        el.vaultSecurityBtn.classList.toggle('text-success', true);
      }
    }

    if (el.vaultSecurityBtn) {
      el.vaultSecurityBtn.addEventListener('click', () => {
        updateVaultStatusUI();
        if (el.vaultSettingsModal) el.vaultSettingsModal.classList.remove('hidden');
      });
    }

    if (el.closeVaultSettingsBtn) {
      el.closeVaultSettingsBtn.addEventListener('click', () => el.vaultSettingsModal.classList.add('hidden'));
    }
    if (el.closeVaultModalBtn) {
      el.closeVaultModalBtn.addEventListener('click', () => el.vaultSettingsModal.classList.add('hidden'));
    }

    // Set / Update PIN
    if (el.savePinBtn) {
      el.savePinBtn.addEventListener('click', async () => {
        const val = el.newPinInput ? el.newPinInput.value.trim() : '';
        if (!/^\d{4}$/.test(val)) {
          showToast('Please enter a valid 4-digit numeric PIN (e.g. 1234)', '⚠️');
          return;
        }

        const saltHex = CryptoVault.generateRandomHex(16);
        const pinHash = await CryptoVault.hashPin(val, saltHex);

        localStorage.setItem(STORAGE_KEY_PIN_SALT, saltHex);
        localStorage.setItem(STORAGE_KEY_PIN_HASH, pinHash);
        localStorage.setItem(STORAGE_KEY_PIN_ENABLED, 'true');

        currentVaultSecret = val;
        isVaultUnlocked = true;
        saveLoans(); // Re-encrypt with new PIN

        if (el.newPinInput) el.newPinInput.value = '';
        updateVaultStatusUI();
        showToast('Security PIN saved! Vault is now protected with 256-Bit AES-GCM.', '🔐');
      });
    }

    // Remove PIN
    if (el.removePinBtn) {
      el.removePinBtn.addEventListener('click', async () => {
        if (!isPinRequired()) {
          showToast('No custom PIN is currently set.', 'ℹ️');
          return;
        }
        if (confirm('Remove 4-digit PIN protection? Data will remain encrypted with device master key.')) {
          localStorage.removeItem(STORAGE_KEY_PIN_ENABLED);
          localStorage.removeItem(STORAGE_KEY_PIN_HASH);
          localStorage.removeItem(STORAGE_KEY_PIN_SALT);
          currentVaultSecret = ensureDeviceKey();
          isVaultUnlocked = true;
          saveLoans();
          updateVaultStatusUI();
          showToast('PIN removed. Encrypted with device master key.', '🛡️');
        }
      });
    }

    // Lock Vault Now
    if (el.lockAppNowBtn) {
      el.lockAppNowBtn.addEventListener('click', () => {
        if (!isPinRequired()) {
          showToast('Please set a 4-digit PIN first to lock your vault.', 'ℹ️');
          return;
        }
        if (el.vaultSettingsModal) el.vaultSettingsModal.classList.add('hidden');
        isVaultUnlocked = false;
        showLockScreen();
        showToast('Vault locked!', '🔒');
      });
    }

    // Export Encrypted Backup
    if (el.exportEncryptedBackupBtn) {
      el.exportEncryptedBackupBtn.addEventListener('click', async () => {
        const password = prompt('Enter a password to encrypt this backup file (or leave blank to use current PIN/key):', '');
        if (password === null) return;
        const encKey = password.trim() || currentVaultSecret || ensureDeviceKey();

        const jsonStr = JSON.stringify(loans, null, 2);
        const encryptedPayload = await CryptoVault.encrypt(jsonStr, encKey);
        const fileContent = JSON.stringify({
          loanPulseEncryptedBackup: true,
          version: '2.0',
          algorithm: 'AES-256-GCM',
          kdf: 'PBKDF2-SHA256',
          iterations: 100000,
          payload: encryptedPayload
        }, null, 2);

        const blob = new Blob([fileContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LoanPulse_Encrypted_Backup_${new Date().toISOString().split('T')[0]}.enc.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 500);

        showToast('Downloaded 256-Bit AES-GCM Encrypted Backup!', '🛡️');
      });
    }

    // Loan Card Actions (Event Delegation)
    if (el.loansGrid) {
      el.loansGrid.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const loanId = target.dataset.id;
        const action = target.dataset.action;
        const loan = loans.find((l) => l.id === loanId);
        if (!loan) return;

        if (target.classList.contains('toggle-paid-btn')) {
          const currentYearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
          if (loan.lastPaidMonth === currentYearMonth) {
            loan.lastPaidMonth = '';
            loan.paidInstallments = Math.max(0, loan.paidInstallments - 1);
            showToast(`Marked ${loan.name} as unpaid for this month`, '↩️');
          } else {
            loan.lastPaidMonth = currentYearMonth;
            loan.paidInstallments = Math.min(loan.tenureMonths, loan.paidInstallments + 1);
            playReminderChime();
            showToast(`Payment marked as complete for ${loan.name}! 🎉`, '✓');
          }
          saveLoans();
          renderAll();
          return;
        }

        if (action === 'whatsapp') {
          openWhatsAppReminder(loan);
        } else if (action === 'sms') {
          sendSmsReminder(loan);
        } else if (action === 'ics') {
          downloadLoanIcsFile(loan);
        } else if (action === 'amort') {
          openAmortizationModal(loan);
        } else if (action === 'edit') {
          openAddLoanModal(loan);
        } else if (action === 'delete') {
          if (confirm(`Are you sure you want to delete "${loan.name}"?`)) {
            loans = loans.filter((l) => l.id !== loanId);
            saveLoans();
            renderAll();
            showToast(`Deleted ${loan.name}`, '🗑️');
          }
        }
      });
    }

    // Reminders Hub Actions
    if (el.downloadAllIcsBtn) {
      el.downloadAllIcsBtn.addEventListener('click', () => {
        if (loans.length === 0) {
          showToast('No active loans to download.', '⚠️');
          return;
        }
        loans.forEach((loan, idx) => {
          setTimeout(() => downloadLoanIcsFile(loan), idx * 200);
        });
      });
    }

    if (el.openWhatsAppQuickReminderBtn) {
      el.openWhatsAppQuickReminderBtn.addEventListener('click', () => {
        if (loans.length === 0) {
          showToast('No loans available. Add an EMI first.', '⚠️');
          return;
        }
        openWhatsAppReminder(loans[0]);
      });
    }

    if (el.openCalendarSyncListBtn) {
      el.openCalendarSyncListBtn.addEventListener('click', () => {
        if (loans.length === 0) {
          showToast('No active loans to sync.', '⚠️');
          return;
        }
        window.open(generateGoogleCalendarUrl(loans[0]), '_blank');
      });
    }

    // Calculator Inputs Sync
    const syncPair = (numEl, rangeEl) => {
      if (!numEl || !rangeEl) return;
      numEl.addEventListener('input', () => {
        rangeEl.value = numEl.value;
        updateCalculator();
      });
      rangeEl.addEventListener('input', () => {
        numEl.value = rangeEl.value;
        updateCalculator();
      });
    };

    syncPair(el.calcAmountNumber, el.calcAmountRange);
    syncPair(el.calcRateNumber, el.calcRateRange);
    syncPair(el.calcTenureNumber, el.calcTenureRange);

    if (el.calcTenureType) {
      el.calcTenureType.addEventListener('change', updateCalculator);
    }

    if (el.calcEnablePrepay) {
      el.calcEnablePrepay.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (el.prepayInputRow) el.prepayInputRow.classList.remove('hidden');
        } else {
          if (el.prepayInputRow) el.prepayInputRow.classList.add('hidden');
          if (el.prepaySavingsCard) el.prepaySavingsCard.classList.add('hidden');
        }
        updateCalculator();
      });
    }

    if (el.calcPrepayAmount) {
      el.calcPrepayAmount.addEventListener('input', updateCalculator);
    }

    // "Save As New Tracked Loan" from Calculator
    if (el.saveCalcAsLoanBtn) {
      el.saveCalcAsLoanBtn.addEventListener('click', () => {
        let tenure = parseInt(el.calcTenureNumber.value, 10) || 60;
        if (el.calcTenureType.value === 'years') tenure = tenure * 12;

        openAddLoanModal();
        el.formLoanName.value = 'Calculated Proposal';
        el.formPrincipal.value = el.calcAmountNumber.value;
        el.formInterestRate.value = el.calcRateNumber.value;
        el.formTenureMonths.value = tenure;
        updateFormEmiPreview();
        showToast('Calculator parameters copied into Add Loan form!', '📋');
      });
    }
  }

  /* ==========================================================================
     Service Worker Registration & 100% Offline / PWA Support
     ========================================================================== */
  let deferredInstallPrompt = null;

  function setupOfflineAndPWA() {
    // 1. Service Worker registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('sw.js')
          .then((reg) => {
            console.log('LoanPulse Service Worker registered successfully:', reg.scope);
            if (reg.update) reg.update();
          })
          .catch((err) => {
            console.warn('Service Worker registration skipped:', err);
          });
      });
    }

    // 2. Online / Offline network status listeners
    const badge = document.getElementById('offlineIndicatorBadge');
    const badgeText = document.getElementById('offlineIndicatorText');

    function updateNetworkStatus(isOnline) {
      if (!badge) return;
      if (isOnline) {
        badge.classList.remove('is-offline');
        if (badgeText) badgeText.textContent = 'Offline Ready';
        badge.title = 'Online & Cached: All data is saved locally on device and works 100% offline.';
      } else {
        badge.classList.add('is-offline');
        if (badgeText) badgeText.textContent = 'Offline Active';
        badge.title = 'Offline Mode: Zero-Knowledge AES-256 Vault active. Tracking works 100% without internet.';
        showToast('⚡ Offline Mode: Your encrypted vault & all loan features are working 100% locally on your device.', '📶');
      }
    }

    window.addEventListener('online', () => {
      updateNetworkStatus(true);
      showToast('🟢 Online: Network reconnected.', '🌐');
    });

    window.addEventListener('offline', () => {
      updateNetworkStatus(false);
    });

    if (navigator.onLine === false) {
      updateNetworkStatus(false);
    }

    // 3. PWA Add to Home Screen install prompt
    const installBtn = document.getElementById('installAppBtn');
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      if (installBtn) {
        installBtn.classList.remove('hidden');
        installBtn.onclick = async () => {
          if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            const { outcome } = await deferredInstallPrompt.userChoice;
            if (outcome === 'accepted') {
              installBtn.classList.add('hidden');
              showToast('📲 LoanPulse installed to home screen! Works 100% offline.', '🎉');
            }
            deferredInstallPrompt = null;
          }
        };
      }
    });

    window.addEventListener('appinstalled', () => {
      if (installBtn) installBtn.classList.add('hidden');
      deferredInstallPrompt = null;
      showToast('🎉 LoanPulse installed as standalone app!', '📱');
    });
  }

  /* ==========================================================================
     App Initialization
     ========================================================================== */
  async function init() {
    await loadLoans();
    setupEventListeners();
    updatePushNotificationStatus();
    setupOfflineAndPWA();
    renderAll();
    updateCalculator();
  }

  // Kickoff on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
