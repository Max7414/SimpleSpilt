const { createApp, computed } = Vue;

createApp({
  data() {
    return {
      token: localStorage.getItem('simpleSplitToken') || null,
      userEmail: localStorage.getItem('simpleSplitEmail') || '',
      auth: {
        email: localStorage.getItem('simpleSplitEmail') || '',
        password: '',
      },
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
    isAuthed() {
      return Boolean(this.token);
    },
    tokenPreview() {
      if (!this.token) return '';
      return `${this.token.slice(0, 24)}...`;
    },
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
    async login() {
      if (!this.auth.email || !this.auth.password) {
        alert('請輸入 email 與密碼。');
        return;
      }
      try {
        await this.authenticate('/api/login');
      } catch (err) {
        alert('登入失敗，請稍後再試。');
        console.error(err);
      }
    },
    async register() {
      if (!this.auth.email || !this.auth.password) {
        alert('請輸入 email 與密碼。');
        return;
      }
      try {
        await this.authenticate('/api/register');
        await this.loadEntries();
      } catch (err) {
        alert('註冊失敗，請稍後再試。');
        console.error(err);
      }
    },
    async authenticate(url) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.auth.email, password: this.auth.password }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || res.statusText);
      }
      const data = await res.json();
      this.token = data.token;
      this.userEmail = data.email || this.auth.email;
      localStorage.setItem('simpleSplitToken', this.token);
      localStorage.setItem('simpleSplitEmail', this.userEmail);
      this.auth.password = '';
      await this.loadEntries();
    },
    logout() {
      this.token = null;
      this.userEmail = '';
      localStorage.removeItem('simpleSplitToken');
      localStorage.removeItem('simpleSplitEmail');
      this.entries = [];
      this.aaUsageCount = 0;
    },
    usePreset(preset) {
      if (!this.isAuthed) {
        alert('請先登入後使用分帳功能。');
        return;
      }
      this.form.item = preset.label;
      this.form.total = preset.amount;
      this.form.perPerson = null;
      this.form.participants = Math.max(this.form.participants || 2, 2);
      this.aaChecked = true;
      this.addEntry();
    },
    addEntry() {
      if (!this.isAuthed) {
        alert('請先登入後使用分帳功能。');
        return;
      }
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

      try {
        const entry = await this.saveEntry({
          item,
          total: Number(total.toFixed(2)),
          participants,
          perPerson: Number(perPerson.toFixed(2)),
          friendOwes: Number(friendOwes.toFixed(2)),
          aa: aaUsed,
        });
        this.entries.unshift(entry);
        if (aaUsed) this.aaUsageCount += 1;
        this.form.item = '';
        this.form.perPerson = null;
      } catch (err) {
        alert('寫入紀錄失敗，請稍後再試。');
        console.error(err);
      }
    },
    async loadEntries() {
      if (!this.token) return;
      try {
        const res = await fetch('/api/entries', {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        this.entries = (data.entries || []).map((row) => ({
          id: row.id,
          item: row.item,
          total: Number(row.total).toFixed(2),
          participants: row.participants,
          perPerson: Number(row.per_person).toFixed(2),
          friendOwes: Number(row.friend_owes).toFixed(2),
          aa: !!row.aa,
        }));
        this.aaUsageCount = this.entries.filter((e) => e.aa).length;
      } catch (err) {
        console.error('載入紀錄失敗', err);
      }
    },
    async saveEntry(entry) {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(entry),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const row = data.entry;
      return {
        id: row.id,
        item: row.item,
        total: Number(row.total).toFixed(2),
        participants: row.participants,
        perPerson: Number(row.per_person).toFixed(2),
        friendOwes: Number(row.friend_owes).toFixed(2),
        aa: !!row.aa,
      };
    },
  },
  mounted() {
    if (this.token) {
      this.loadEntries();
    }
  },
}).mount('#app');
