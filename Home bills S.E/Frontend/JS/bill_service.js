const BillService = {
  getSummary(bills) {
    const unpaidBills = bills.filter((bill) => bill.status === "unpaid");
    const unpaidAmount = unpaidBills.reduce(
      (sum, bill) => sum + convertAmount(bill.amount, bill.currency, "USD"),
      0
    );

    return {
      total: unpaidAmount,
      paid: bills.filter((bill) => bill.status === "paid").length,
      unpaid: unpaidBills.length,
      overdue: bills.filter(isOverdue).length,
      unpaidAmount,
    };
  },

  formatDateValue(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  },

  isRecurring(bill) {
    return bill.frequency && bill.frequency !== BILL_FREQUENCIES.once;
  },

  paidOccurrenceKey(bill) {
    return `${bill.id}:${bill.due_date}`;
  },

  isPaidOccurrence(bill) {
    return Boolean(StorageService.getPaidOccurrences()[this.paidOccurrenceKey(bill)]);
  },

  unpaidOccurrenceKeys(bills, baseDate = new Date()) {
    return this.forMonth(bills, baseDate)
      .filter((bill) => bill.status === "unpaid")
      .map((bill) => this.paidOccurrenceKey(bill));
  },

  setPaidOccurrence(bill) {
    const paid = StorageService.getPaidOccurrences();
    paid[this.paidOccurrenceKey(bill)] = true;
    StorageService.setPaidOccurrences(paid);
  },

  clearPaidOccurrencesForBill(billId) {
    const paid = StorageService.getPaidOccurrences();
    Object.keys(paid).forEach((key) => {
      if (key.startsWith(`${billId}:`)) {
        delete paid[key];
      }
    });
    StorageService.setPaidOccurrences(paid);
  },

  withOccurrenceStatus(bill) {
    if (!this.isRecurring(bill) || bill.status === "paid") return bill;
    return {
      ...bill,
      status: this.isPaidOccurrence(bill) ? "paid" : "unpaid",
    };
  },

  expandForDateRange(bills, fromDate, toDate) {
    return bills.flatMap((bill) => {
      const dueDate = parseDate(bill.due_date);
      const frequency = bill.frequency || BILL_FREQUENCIES.once;

      if (frequency === BILL_FREQUENCIES.once) {
        return dueDate >= fromDate && dueDate <= toDate ? [bill] : [];
      }

      const dates = this.expandDates(dueDate, frequency, fromDate, toDate);
      return dates.map((date) => ({ ...bill, due_date: this.formatDateValue(date) }));
    });
  },

  expandDates(dueDate, frequency, fromDate, toDate) {
    const nextDate = this.frequencyStrategies[frequency];
    if (!nextDate) return [];

    let current = new Date(dueDate);
    while (current < fromDate) {
      current = nextDate(current, dueDate);
    }

    const dates = [];
    while (current <= toDate) {
      if (current >= dueDate) {
        dates.push(new Date(current));
      }
      current = nextDate(current, dueDate);
    }
    return dates;
  },

  forMonth(bills, baseDate = new Date()) {
    const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const monthEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);

    return this.expandForDateRange(bills, monthStart, monthEnd)
      .map((bill) => this.withOccurrenceStatus(bill))
      .sort((a, b) => parseDate(a.due_date) - parseDate(b.due_date));
  },

  frequencyStrategies: {
    weekly(current) {
      const next = new Date(current);
      next.setDate(next.getDate() + WEEKLY_INTERVAL_DAYS);
      return next;
    },

    monthly(current, originalDueDate) {
      const year = current.getFullYear() + (current.getMonth() === 11 ? 1 : 0);
      const month = current.getMonth() === 11 ? 0 : current.getMonth() + 1;
      const day = Math.min(originalDueDate.getDate(), new Date(year, month + 1, 0).getDate());
      return new Date(year, month, day);
    },

    yearly(current, originalDueDate) {
      const year = current.getFullYear() + 1;
      const day = Math.min(originalDueDate.getDate(), new Date(year, originalDueDate.getMonth() + 1, 0).getDate());
      return new Date(year, originalDueDate.getMonth(), day);
    },
  },
};
