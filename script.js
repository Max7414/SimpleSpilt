const { createApp, computed } = Vue;

createApp({
  data() {
    return {
      quickAddEnabled: true,
      splitFeatureEnabled: true,
      aaChecked: true,
      form: {
        item: '',
        total: 100,
        participants: 2,
        perPerson: null,
      },
      quickPresets: [
        { label: '午餐', emoji: '🍱', amount: 100 },
        { label: '手搖', emoji: '🥤', amount: 50 },
        { label: '咖啡', emoji: '☕️', amount: 80 },
        { label: '宵夜', emoji: '🍜', amount: 120 },
      ],
      entries: [],
      aaUsageCount: 0,
    };
  },
  computed: {
    autoPerPerson() {
      if (!(this.splitFeatureEnabled && this.aaChecked)) return null;
      const total = Number(this.form.total);
      const participants = Number(this.form.participants) || 1;
      if (!participants) return null;
      return total / participants;
    },
    autoPerPersonDisplay() {
      const value = this.autoPerPerson;
      return value !== null ? value.toFixed(2) : '';
    },
    totalFriendOwes() {
      const total = this.entries.reduce((acc, entry) => acc + entry.friendOwes, 0);
      return total.toFixed(2);
    },
    aaUsageRate() {
      if (!this.entries.length) return 0;
      const rate = (this.aaUsageCount / this.entries.length) * 100;
      return Math.round(rate);
    },
  },
  methods: {
    usePreset(preset) {
      this.form.item = preset.label;
      this.form.total = preset.amount;
      this.form.perPerson = null;
      this.form.participants = Math.max(this.form.participants || 2, 2);
      this.aaChecked = true;
      this.addEntry();
    },
    addEntry() {
      const item = this.form.item || '未命名';
      const total = Number(this.form.total);
      const participants = Number(this.form.participants) || 2;

      if (total <= 0 || participants < 2) {
        alert('請輸入有效的金額與人數 (至少 2 人)。');
        return;
      }

      let perPerson;
      let aaUsed = false;

      if (this.splitFeatureEnabled && this.aaChecked) {
        perPerson = this.autoPerPerson;
        aaUsed = true;
      } else {
        perPerson = Number(this.form.perPerson);
      }

      if (!perPerson || perPerson <= 0) {
        alert('請輸入每人應付金額。');
        return;
      }

      const friendCount = Math.max(participants - 1, 1);
      const friendOwes = perPerson * friendCount;

      this.entries.unshift({
        id: crypto.randomUUID(),
        item,
        total: total.toFixed(2),
        participants,
        perPerson: perPerson.toFixed(2),
        friendOwes: Number(friendOwes.toFixed(2)),
        aa: aaUsed,
      });

      if (aaUsed) this.aaUsageCount += 1;

      this.form.item = '';
      this.form.perPerson = null;
    },
  },
}).mount('#app');
