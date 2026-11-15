// src/core.js
var CATEGORIES = Object.freeze(["\u0412\u041E\u041F\u0420\u041E\u0421", "\u041F\u0420\u041E\u0421\u042C\u0411\u0410", "\u041F\u0420\u041E\u0411\u041B\u0415\u041C\u0410", "\u041F\u0420\u0415\u0414\u041B\u041E\u0416\u0415\u041D\u0418\u0415", "\u0418\u041D\u0424\u041E\u0420\u041C\u0410\u0426\u0418\u042F"]);
var SAMPLES = Object.freeze({
  question: "\u0421\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0442\u0435\u0441\u0442: \u0432\u043E \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u043D\u0430\u0447\u0438\u043D\u0430\u0435\u0442\u0441\u044F \u0442\u0435\u0441\u0442\u043E\u0432\u0430\u044F \u0432\u0441\u0442\u0440\u0435\u0447\u0430?",
  request: "\u0421\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0442\u0435\u0441\u0442: \u043F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u044C\u0442\u0435 \u0434\u0435\u043C\u043E\u043D\u0441\u0442\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u043E\u0442\u0447\u0451\u0442.",
  problem: "\u0421\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0442\u0435\u0441\u0442: \u0434\u0435\u043C\u043E\u043D\u0441\u0442\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u0441\u0435\u0440\u0432\u0435\u0440 \u043D\u0435 \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442.",
  suggestion: "\u0421\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0442\u0435\u0441\u0442: \u043F\u0440\u0435\u0434\u043B\u0430\u0433\u0430\u044E \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0442\u0435\u0441\u0442\u043E\u0432\u0443\u044E \u043A\u043D\u043E\u043F\u043A\u0443.",
  information: "\u0421\u0438\u043D\u0442\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0442\u0435\u0441\u0442: \u0434\u0435\u043C\u043E\u043D\u0441\u0442\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u0430\u044F \u0432\u0441\u0442\u0440\u0435\u0447\u0430 \u0441\u043E\u0441\u0442\u043E\u0438\u0442\u0441\u044F \u0432 10:00."
});

// src/coordinator/service.js
var STATUSES = Object.freeze(["new", "in_progress", "done"]);
var InputError = class extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
};
function text(value, max, name) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new InputError(`\u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043F\u043E\u043B\u0435 \xAB${name}\xBB: \u043E\u0442 1 \u0434\u043E ${max} \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432.`);
  return value.trim();
}
function category(value) {
  if (!CATEGORIES.includes(value)) throw new InputError("\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043E\u0434\u043D\u0443 \u0438\u0437 \u043F\u044F\u0442\u0438 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0439.");
  return value;
}
function taskInput(input) {
  if (!input || typeof input !== "object") throw new InputError("\u041D\u0435 \u0437\u0430\u043F\u043E\u043B\u043D\u0435\u043D\u044B \u0434\u0430\u043D\u043D\u044B\u0435 \u0437\u0430\u0434\u0430\u0447\u0438.");
  const t = { title: text(input.title, 200, "\u0417\u0430\u0434\u0430\u0447\u0430"), assignee: text(input.assignee, 100, "\u041E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439"), due_date: input.due_date, status: input.status };
  if (typeof t.due_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(t.due_date) || !Number.isFinite(Date.parse(t.due_date + "T12:00:00Z")) || (/* @__PURE__ */ new Date(t.due_date + "T12:00:00Z")).toISOString().slice(0, 10) !== t.due_date || t.due_date < "1900-01-01" || t.due_date > "9999-12-31") throw new InputError("\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0443\u044E \u0434\u0430\u0442\u0443 \u0441\u0440\u043E\u043A\u0430.");
  if (!STATUSES.includes(t.status)) throw new InputError("\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0442\u0430\u0442\u0443\u0441 \u0437\u0430\u0434\u0430\u0447\u0438.");
  return t;
}
function localDate(now = /* @__PURE__ */ new Date(), timeZone) {
  if (timeZone) {
    const parts = new Intl.DateTimeFormat("en", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
    const part = (type) => parts.find((p) => p.type === type).value;
    return `${part("year")}-${part("month")}-${part("day")}`;
  }
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
var CoordinatorService = class {
  constructor(repository, classifier, clock = () => /* @__PURE__ */ new Date(), options = {}) {
    this.repository = repository;
    this.classifier = classifier;
    this.clock = clock;
    this.options = options;
  }
  async addMessages(input) {
    if (!input || !Array.isArray(input.messages) || input.messages.length < 1 || input.messages.length > 15) throw new InputError("\u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u043E\u0442 1 \u0434\u043E 15 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0445 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439.");
    const prepared = input.messages.map((m) => {
      if (!m || typeof m !== "object") throw new InputError("\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F.");
      return { text: text(m.text, 4e3, "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435"), category: m.category == null ? null : category(m.category) };
    });
    const at = this.clock().toISOString();
    const records = [];
    for (const m of prepared) {
      const classified = m.category ? { category: m.category, method: "manual" } : await this.classifier.classify(m.text);
      records.push({ id: crypto.randomUUID(), text: m.text, category: category(classified.category), original_category: classified.category, classification_method: classified.method, manually_corrected: 0, created_at: at, updated_at: at });
    }
    return this.repository.addMessages(records);
  }
  async correctMessage(id, input) {
    if (!await this.repository.message(id)) throw new InputError("\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E.", 404);
    return this.repository.correctMessage(id, category(input?.category), this.clock().toISOString());
  }
  async addTask(input) {
    const fields = taskInput(input);
    if (!await this.repository.message(input.message_id)) throw new InputError("\u0418\u0441\u0445\u043E\u0434\u043D\u043E\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E.", 404);
    const at = this.clock().toISOString();
    return this.repository.addTask({ ...fields, id: crypto.randomUUID(), message_id: input.message_id, created_at: at, updated_at: at });
  }
  async updateTask(id, input) {
    if (!await this.repository.task(id)) throw new InputError("\u0417\u0430\u0434\u0430\u0447\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430.", 404);
    return this.repository.updateTask(id, taskInput(input), this.clock().toISOString());
  }
  async state() {
    const [messages, tasks] = await Promise.all([this.repository.messages(), this.repository.tasks()]);
    const today = localDate(this.clock(), this.options.timeZone);
    return { mode: this.options.mode ?? "demo", categories: CATEGORIES, today, messages, tasks, analytics: {
      messages: messages.length,
      tasks: tasks.length,
      byCategory: Object.fromEntries(CATEGORIES.map((c) => [c, messages.filter((m) => m.category === c).length])),
      byStatus: Object.fromEntries(STATUSES.map((s) => [s, tasks.filter((t) => t.status === s).length])),
      byAssignee: tasks.reduce((a, t) => {
        a[t.assignee] = (a[t.assignee] ?? 0) + 1;
        return a;
      }, /* @__PURE__ */ Object.create(null)),
      overdue: tasks.filter((t) => t.status !== "done" && t.due_date < today).length
    } };
  }
};

// src/coordinator/classifier.js
var DemoClassifier = class {
  async classify(text2) {
    const rules = [
      ["\u041F\u0420\u041E\u0411\u041B\u0415\u041C\u0410", /не работает|ошибк|сломал|сбой|проблем|не отвечает|задержк|недоступ/i],
      ["\u041F\u0420\u0415\u0414\u041B\u041E\u0416\u0415\u041D\u0418\u0415", /предлага|давайте|можно улучш|стоит добав/i],
      ["\u041F\u0420\u041E\u0421\u042C\u0411\u0410", /пожалуйста|прошу|пришлите|подготовьте|сделайте|проверьте|нужно/i],
      ["\u0412\u041E\u041F\u0420\u041E\u0421", /\?|^(как|когда|где|почему|сколько|кто|какой|можно ли)(?=\s|$)/iu]
    ];
    const category2 = rules.find(([, pattern]) => pattern.test(text2))?.[0] ?? "\u0418\u041D\u0424\u041E\u0420\u041C\u0410\u0426\u0418\u042F";
    if (!CATEGORIES.includes(category2)) throw new Error("INVALID_DEMO_CATEGORY");
    return { category: category2, method: "demo-rules" };
  }
};

// src/demo/repository.js
var DB_NAME = "clario-portfolio-demo-v1";
var empty = () => ({ messages: [], tasks: [] });
var copy = (value) => structuredClone(value);
var sorted = (rows) => [...rows].sort((a, b) => a.created_at === b.created_at ? a.id > b.id ? -1 : a.id < b.id ? 1 : 0 : a.created_at > b.created_at ? -1 : 1);
var storageError = () => new Error("\u0411\u0440\u0430\u0443\u0437\u0435\u0440 \u043D\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u043B \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435. \u0414\u0430\u043D\u043D\u044B\u0435 \u0444\u043E\u0440\u043C\u044B \u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u044B. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0435 \u043C\u0435\u0441\u0442\u043E \u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F; \u043F\u0435\u0440\u0435\u0434 \u043F\u043E\u0432\u0442\u043E\u0440\u043E\u043C \u043F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0441\u043F\u0438\u0441\u043E\u043A.");
function validate(data) {
  const uuid = /^[a-f0-9-]{36}$/;
  const categories = ["\u0412\u041E\u041F\u0420\u041E\u0421", "\u041F\u0420\u041E\u0421\u042C\u0411\u0410", "\u041F\u0420\u041E\u0411\u041B\u0415\u041C\u0410", "\u041F\u0420\u0415\u0414\u041B\u041E\u0416\u0415\u041D\u0418\u0415", "\u0418\u041D\u0424\u041E\u0420\u041C\u0410\u0426\u0418\u042F"];
  if (!data || !Array.isArray(data.messages) || !Array.isArray(data.tasks)) throw storageError();
  for (const m of data.messages) if (!uuid.test(m.id) || typeof m.text !== "string" || !categories.includes(m.category) || !categories.includes(m.original_category) || !["demo-rules", "manual", "workers-ai"].includes(m.classification_method) || !Number.isFinite(Date.parse(m.created_at))) throw storageError();
  const ids = new Set(data.messages.map((m) => m.id));
  for (const t of data.tasks) if (!uuid.test(t.id) || !ids.has(t.message_id) || typeof t.title !== "string" || typeof t.assignee !== "string" || !t.assignee || !["new", "in_progress", "done"].includes(t.status) || !/^\d{4}-\d{2}-\d{2}$/.test(t.due_date) || !Number.isFinite(Date.parse(t.created_at))) throw storageError();
  return data;
}
var MemoryStore = class {
  constructor(data = empty()) {
    this.data = copy(data);
    this.persistent = false;
  }
  async transact(change) {
    const data = copy(this.data);
    const result = change(data);
    validate(data);
    this.data = data;
    return copy(result);
  }
  async read() {
    return copy(validate(this.data));
  }
  close() {
  }
};
var IndexedStore = class {
  constructor(db) {
    this.db = db;
    this.persistent = true;
  }
  transact(change) {
    return new Promise((resolve, reject) => {
      let result, tx;
      try {
        tx = this.db.transaction("workspace", change ? "readwrite" : "readonly");
        const store = tx.objectStore("workspace"), request = store.get("state");
        request.onsuccess = () => {
          try {
            const data = validate(request.result ?? empty());
            result = change ? change(data) : data;
            if (change) store.put(validate(data), "state");
          } catch {
            tx.abort();
          }
        };
        tx.oncomplete = () => resolve(copy(result));
        tx.onabort = () => reject(storageError());
        tx.onerror = () => reject(storageError());
      } catch {
        reject(storageError());
      }
    });
  }
  read() {
    return this.transact(null);
  }
  close() {
    this.db.close();
  }
};
async function openDemoStore(options = {}) {
  const onWarning = options.onWarning ?? (() => {
  });
  try {
    const indexedDB = Object.hasOwn(options, "indexedDB") ? options.indexedDB : globalThis.indexedDB;
    if (!indexedDB) throw storageError();
    const db = await new Promise((resolve, reject) => {
      let settled = false;
      const request = indexedDB.open(options.name ?? DB_NAME, 1);
      const timer = setTimeout(() => {
        settled = true;
        reject(storageError());
      }, 3e3);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("workspace")) request.result.createObjectStore("workspace");
      };
      request.onsuccess = () => {
        clearTimeout(timer);
        if (settled) {
          request.result.close();
          return;
        }
        settled = true;
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
      request.onerror = request.onblocked = () => {
        clearTimeout(timer);
        settled = true;
        reject(storageError());
      };
    });
    const store = new IndexedStore(db);
    try {
      await store.read();
    } catch (error) {
      store.close();
      throw error;
    }
    return store;
  } catch {
    onWarning("\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u0432 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E. \u0420\u0430\u0431\u043E\u0442\u0430\u0435\u043C \u0442\u043E\u043B\u044C\u043A\u043E \u0432 \u043F\u0430\u043C\u044F\u0442\u0438: \u043F\u043E\u0441\u043B\u0435 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u0434\u0430\u043D\u043D\u044B\u0435 \u0438\u0441\u0447\u0435\u0437\u043D\u0443\u0442. \u0421\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0430\u044F \u0431\u0430\u0437\u0430 \u043D\u0435 \u0443\u0434\u0430\u043B\u0435\u043D\u0430.");
    return new MemoryStore();
  }
}
var BrowserRepository = class {
  constructor(store) {
    this.store = store;
  }
  async messages() {
    return sorted((await this.store.read()).messages);
  }
  async message(id) {
    return (await this.store.read()).messages.find((m) => m.id === id) ?? null;
  }
  async tasks() {
    return this.join(await this.store.read());
  }
  join(data) {
    return sorted(data.tasks).map((t) => {
      const m = data.messages.find((m2) => m2.id === t.message_id);
      return { ...t, message_text: m.text, message_category: m.category };
    });
  }
  async task(id) {
    return (await this.tasks()).find((t) => t.id === id) ?? null;
  }
  addMessages(records) {
    return this.store.transact((data) => {
      if (records.some((r) => data.messages.some((m) => m.id === r.id))) throw storageError();
      data.messages.push(...copy(records));
      return records;
    });
  }
  correctMessage(id, category2, at) {
    return this.store.transact((data) => {
      const m = data.messages.find((m2) => m2.id === id);
      if (!m) throw storageError();
      Object.assign(m, { category: category2, manually_corrected: 1, updated_at: at });
      return m;
    });
  }
  addTask(task) {
    return this.store.transact((data) => {
      if (!data.messages.some((m) => m.id === task.message_id) || data.tasks.some((t) => t.id === task.id)) throw storageError();
      data.tasks.push(copy(task));
      return this.join(data).find((t) => t.id === task.id);
    });
  }
  updateTask(id, fields, at) {
    return this.store.transact((data) => {
      const t = data.tasks.find((t2) => t2.id === id);
      if (!t) throw storageError();
      Object.assign(t, fields, { updated_at: at });
      return this.join(data).find((t2) => t2.id === id);
    });
  }
  reset() {
    return this.store.transact((data) => {
      data.messages = [];
      data.tasks = [];
      return true;
    });
  }
};

// src/demo/fixtures.js
var demoMessages = Object.freeze([
  "\u041A\u043E\u0433\u0434\u0430 \u0431\u0443\u0434\u0435\u0442 \u0441\u043E\u0433\u043B\u0430\u0441\u043E\u0432\u0430\u043D \u0433\u0440\u0430\u0444\u0438\u043A \u0434\u0435\u0436\u0443\u0440\u0441\u0442\u0432 \u043D\u0430 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0443\u044E \u043D\u0435\u0434\u0435\u043B\u044E?",
  "\u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u044C\u0442\u0435 \u0441\u0432\u043E\u0434\u043A\u0443 \u043E\u0442\u043A\u0440\u044B\u0442\u044B\u0445 \u0437\u0430\u0434\u0430\u0447 \u043A \u0432\u0441\u0442\u0440\u0435\u0447\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u044B.",
  "\u0412 \u0442\u0435\u0441\u0442\u043E\u0432\u043E\u043C \u043A\u0430\u0431\u0438\u043D\u0435\u0442\u0435 \u043D\u0435 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u0437\u0430\u044F\u0432\u043A\u0438.",
  "\u041F\u0440\u0435\u0434\u043B\u0430\u0433\u0430\u044E \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0435\u0434\u0438\u043D\u044B\u0439 \u0448\u0430\u0431\u043B\u043E\u043D \u043F\u0435\u0440\u0435\u0434\u0430\u0447\u0438 \u0437\u0430\u0434\u0430\u0447 \u043C\u0435\u0436\u0434\u0443 \u0441\u043C\u0435\u043D\u0430\u043C\u0438.",
  "\u0423\u0447\u0435\u0431\u043D\u0430\u044F \u0432\u0441\u0442\u0440\u0435\u0447\u0430 \u043A\u043E\u043C\u0430\u043D\u0434\u044B \u0441\u043E\u0441\u0442\u043E\u0438\u0442\u0441\u044F \u0437\u0430\u0432\u0442\u0440\u0430 \u0432 10:00."
]);

// src/demo/runtime.js
function createDemoApi(store, { clock = () => /* @__PURE__ */ new Date() } = {}) {
  const repository = new BrowserRepository(store);
  const service = new CoordinatorService(repository, new DemoClassifier(), clock, { mode: "browser-demo" });
  let queue = Promise.resolve();
  const execute = async (path, method, body) => {
    if (path === "/state" && method === "GET") {
      const snapshot = new BrowserRepository(new MemoryStore(await store.read()));
      return { ...await new CoordinatorService(snapshot, new DemoClassifier(), clock, { mode: "browser-demo" }).state(), storagePersistent: store.persistent };
    }
    if (path === "/messages" && method === "POST") return { messages: await service.addMessages(body) };
    const message = path.match(/^\/messages\/([a-f0-9-]{36})$/);
    if (message && method === "PATCH") return { message: await service.correctMessage(message[1], body) };
    if (path === "/tasks" && method === "POST") return { task: await service.addTask(body) };
    const task = path.match(/^\/tasks\/([a-f0-9-]{36})$/);
    if (task && method === "PATCH") return { task: await service.updateTask(task[1], body) };
    if (path === "/reset" && method === "POST") return { reset: await repository.reset() };
    throw new InputError("\u041E\u043F\u0435\u0440\u0430\u0446\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430.", 404);
  };
  return (path, method = "GET", body) => {
    const result = queue.then(() => execute(path, method, body));
    queue = result.catch(() => {
    });
    return result;
  };
}

// public/public-ai-config.js
var publicAiConfig = Object.freeze({ enabled: true, endpoint: "https://clario-demo-ai.olshevskayamarina.workers.dev/classify", sitekey: "0x4AAAAAAGB4bsfNWNZUJkNG" });

// src/public-demo/turnstile.js
var loading;
async function load() {
  if (globalThis.turnstile) return globalThis.turnstile;
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    const timer = setTimeout(() => reject(Error("Turnstile \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D. AI \u043D\u0435 \u0432\u044B\u0437\u0432\u0430\u043D.")), 1e4);
    script.onload = () => {
      clearTimeout(timer);
      resolve(globalThis.turnstile);
    };
    script.onerror = () => {
      clearTimeout(timer);
      reject(Error("Turnstile \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D. AI \u043D\u0435 \u0432\u044B\u0437\u0432\u0430\u043D."));
    };
    document.head.append(script);
  }).catch((error) => {
    loading = void 0;
    throw error;
  });
  return loading;
}
async function challenge(sitekey) {
  const turnstile = await load(), target = document.querySelector("#public-ai-challenge");
  if (!target || !turnstile) throw Error("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0443 Turnstile.");
  return new Promise((resolve, reject) => {
    let widget;
    const finish = (error, token) => {
      clearTimeout(timer);
      if (widget !== void 0) turnstile.remove(widget);
      target.replaceChildren();
      error ? reject(Error(error)) : resolve(token);
    };
    const timer = setTimeout(() => finish("\u0412\u0440\u0435\u043C\u044F \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F Turnstile \u0438\u0441\u0442\u0435\u043A\u043B\u043E. AI \u043D\u0435 \u0432\u044B\u0437\u0432\u0430\u043D."), 12e4);
    try {
      widget = turnstile.render(target, { sitekey, action: "clario_classify", callback: (token) => finish(null, token), "error-callback": () => finish("\u041E\u0448\u0438\u0431\u043A\u0430 Turnstile. AI \u043D\u0435 \u0432\u044B\u0437\u0432\u0430\u043D."), "expired-callback": () => finish("\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u0438\u0441\u0442\u0435\u043A\u043B\u043E. AI \u043D\u0435 \u0432\u044B\u0437\u0432\u0430\u043D.") });
    } catch {
      finish("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043A\u0440\u044B\u0442\u044C Turnstile. AI \u043D\u0435 \u0432\u044B\u0437\u0432\u0430\u043D.");
    }
  });
}

// src/public-ai-policy.js
var PUBLIC_AI_DAILY_LIMIT = 5;
var AI_LIMIT_MESSAGE = "\u0414\u043D\u0435\u0432\u043D\u043E\u0439 \u043B\u0438\u043C\u0438\u0442 AI-\u043A\u043B\u0430\u0441\u0441\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u0438 \u0438\u0441\u0447\u0435\u0440\u043F\u0430\u043D. \u0412\u044B \u043C\u043E\u0436\u0435\u0442\u0435 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C \u0440\u0430\u0431\u043E\u0442\u0443 \u0432 \u0434\u0435\u043C\u043E\u043D\u0441\u0442\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u043E\u043C \u0440\u0435\u0436\u0438\u043C\u0435 \u0431\u0435\u0437 AI";

// src/public-demo/runtime.js
var openDemoStore2 = (options = {}) => openDemoStore({ ...options, name: "clario-portfolio-public-ai-v1" });
function createPublicDemoApi(store, { config = publicAiConfig, fetchImpl = fetch, getToken = () => challenge(config.sitekey) } = {}) {
  const demo = createDemoApi(store);
  const repository = new BrowserRepository(store);
  let mode = "demo", queue = Promise.resolve(), aiQuota = null;
  async function execute(path, method, body) {
    if (path === "/classification-mode" && method === "POST") {
      if (!["demo", "real-ai"].includes(body?.mode)) throw new InputError("\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C.");
      mode = body.mode;
      return { mode };
    }
    if (path === "/state" && method === "GET") return { ...await demo(path, method, body), classificationMode: mode, publicAiConfigured: config.enabled === true, aiDailyLimit: PUBLIC_AI_DAILY_LIMIT, aiQuota };
    if (path !== "/messages" || method !== "POST" || mode !== "real-ai") return demo(path, method, body);
    if (!body || !Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 15 || body.messages.some((m) => !m || typeof m.text !== "string" || !m.text.trim() || m.text.trim().length > 4e3 || m.category != null && !CATEGORIES.includes(m.category))) throw new InputError("\u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 1\u201315 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u043F\u043E 1\u20134000 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432 \u0441 \u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u044B\u043C\u0438 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F\u043C\u0438.");
    const pending = body.messages.filter((m) => m.category == null);
    let results = [];
    if (pending.length) {
      if (pending.length > PUBLIC_AI_DAILY_LIMIT) {
        const error = new Error("\u041F\u0430\u043A\u0435\u0442 \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0435\u0433\u043E AI \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u043F\u0440\u0435\u0432\u044B\u0448\u0430\u0442\u044C 5 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439. \u0423\u043C\u0435\u043D\u044C\u0448\u0438\u0442\u0435 \u043F\u0430\u043A\u0435\u0442 \u0438\u043B\u0438 \u044F\u0432\u043D\u043E \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u0435\u043C\u043E\u043D\u0441\u0442\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C \u2014 \u0434\u043E 15 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439.");
        error.code = "AI_BATCH_LIMIT";
        throw error;
      }
      let url;
      try {
        url = new URL(config.endpoint);
      } catch {
      }
      if (config.enabled !== true || !url || url.protocol !== "https:" || url.pathname !== "/classify" || url.search || url.hash || url.username || url.password || !config.sitekey) throw new Error("\u041F\u0443\u0431\u043B\u0438\u0447\u043D\u044B\u0439 AI \u0435\u0449\u0451 \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D. \u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u0435\u043C\u043E\u0440\u0435\u0436\u0438\u043C \u0438\u043B\u0438 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E \u0432\u0440\u0443\u0447\u043D\u0443\u044E.");
      const turnstileToken = await getToken();
      let response, data;
      try {
        response = await fetchImpl(url.href, { method: "POST", credentials: "omit", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: pending.map((m) => ({ text: m.text.trim() })), turnstileToken }), redirect: "error", signal: AbortSignal.timeout(6e4) });
        data = await response.json();
      } catch {
        throw new Error("\u041D\u0435\u0442 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043D\u043D\u043E\u0433\u043E \u043E\u0442\u0432\u0435\u0442\u0430 \u043F\u0443\u0431\u043B\u0438\u0447\u043D\u043E\u0433\u043E AI. \u0412\u0432\u043E\u0434 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D \u0432 \u0444\u043E\u0440\u043C\u0435; \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u043F\u043E\u0432\u0442\u043E\u0440\u0430 \u0438 \u0434\u0435\u043C\u043E\u043F\u043E\u0434\u043C\u0435\u043D\u044B \u043D\u0435\u0442.");
      }
      if (data?.quota?.limit === PUBLIC_AI_DAILY_LIMIT && Number.isInteger(data.quota.used) && data.quota.used >= 0 && Number.isInteger(data.quota.remaining) && data.quota.remaining === Math.max(0, PUBLIC_AI_DAILY_LIMIT - data.quota.used)) aiQuota = data.quota;
      if (!response.ok) {
        const message = data?.code === "AI_DAILY_LIMIT" ? aiQuota?.remaining === 0 ? AI_LIMIT_MESSAGE : `\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043E\u0441\u0442\u0430\u0442\u043A\u0430 AI \u0434\u043B\u044F \u0432\u0441\u0435\u0433\u043E \u043F\u0430\u043A\u0435\u0442\u0430${aiQuota ? ": " + aiQuota.remaining + " \u0438\u0437 5" : ""}. \u0423\u043C\u0435\u043D\u044C\u0448\u0438\u0442\u0435 \u043F\u0430\u043A\u0435\u0442 \u0438\u043B\u0438 \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u0435\u043C\u043E\u043D\u0441\u0442\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C \u0431\u0435\u0437 AI.` : "AI \u043D\u0435 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043B \u043F\u0430\u043A\u0435\u0442. " + ({ TURNSTILE_FAILED: "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0443 Turnstile \u0437\u0430\u043D\u043E\u0432\u043E.", TOKEN_REUSED: "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u0443\u0436\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u043E.", AI_BATCH_LIMIT: "\u0412 \u043F\u0430\u043A\u0435\u0442\u0435 \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0435\u0433\u043E AI \u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u043E \u043D\u0435 \u0431\u043E\u043B\u0435\u0435 5 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439.", IP_DAILY_LIMIT: "\u041B\u0438\u043C\u0438\u0442 \u0434\u043B\u044F \u0432\u0430\u0448\u0435\u0433\u043E \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u0438\u0441\u0447\u0435\u0440\u043F\u0430\u043D.", RATE_LIMIT: "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432.", AI_BUSY: "AI \u0437\u0430\u043D\u044F\u0442.", AI_TIMEOUT: "\u0412\u0440\u0435\u043C\u044F \u043E\u0436\u0438\u0434\u0430\u043D\u0438\u044F \u0438\u0441\u0442\u0435\u043A\u043B\u043E." }[data?.code] ?? "\u0421\u0435\u0440\u0432\u0438\u0441 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D \u0438\u043B\u0438 \u043A\u0432\u043E\u0442\u0430 \u0438\u0441\u0447\u0435\u0440\u043F\u0430\u043D\u0430.") + " \u041F\u0430\u043A\u0435\u0442 \u043D\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D; \u043C\u043E\u0436\u043D\u043E \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 \u0432\u0440\u0443\u0447\u043D\u0443\u044E.";
        const error = new Error(message);
        error.code = data?.code;
        throw error;
      }
      if (data?.model !== "@cf/zai-org/glm-4.7-flash" || !Array.isArray(data.results) || data.results.length !== pending.length || data.results.some((r) => !CATEGORIES.includes(r?.category) || r.method !== "workers-ai")) throw new Error("AI \u0432\u0435\u0440\u043D\u0443\u043B \u043D\u0435\u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043D\u043D\u044B\u0439 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442. \u041F\u0430\u043A\u0435\u0442 \u043D\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D.");
      results = data.results;
    }
    let index = 0;
    return { messages: await new CoordinatorService(repository, { async classify() {
      const result = results[index++];
      if (!result) throw Error("AI_RESULT_MISSING");
      return result;
    } }).addMessages(body) };
  }
  return (path, method = "GET", body) => {
    const result = queue.then(() => execute(path, method, body));
    queue = result.catch(() => {
    });
    return result;
  };
}
var instance;
async function api(path, method = "GET", body) {
  instance ??= openDemoStore2().then((store) => createPublicDemoApi(store));
  return (await instance)(path, method, body);
}
export {
  api,
  createPublicDemoApi,
  demoMessages,
  openDemoStore2 as openDemoStore
};
