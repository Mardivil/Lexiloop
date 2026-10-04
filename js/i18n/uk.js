/** Ukrainian interface strings. */
export default {
    'app.title': 'Lexiloop',
    'app.tagline': 'Вивчення японських слів',

    'lang.ja': 'Японська',
    'lang.uk': 'Українська',
    'lang.und': 'Переклад',

    'words': { one: '{count} слово', few: '{count} слова', many: '{count} слів', other: '{count} слова' },

    'start.list.title': 'Список слів',
    'start.list.empty': 'Список ще не завантажено.',
    'start.list.saved': 'Збережено: {words}',
    'start.list.file': '{name} · завантажено {date}',
    'start.source':
        'Файл можна взяти з пристрою або з Google Диска: на iPhone — у «Файлах», розділ Google Drive; на ПК — з диска Google Drive.',
    'start.load': 'Завантажити .xlsx',
    'start.replace': 'Завантажити інший файл',
    'start.loading': 'Читаю файл…',
    'start.format':
        'Береться перший аркуш. Рядок 1 — заголовок, і назва стовпця C показується як назва мови перекладу. Стовпець B — слово японською (кана), стовпець C — переклад будь-якою мовою.',
    'start.direction': 'Напрям',
    'start.direction.option': '{from} → {to}',
    'start.mode': 'Режим',
    'start.begin': 'Почати',

    'import.ok': 'Завантажено: {words}.',
    'import.incomplete': {
        one: 'Пропущено {count} неповний рядок.',
        few: 'Пропущено {count} неповні рядки.',
        many: 'Пропущено {count} неповних рядків.',
        other: 'Пропущено {count} неповного рядка.',
    },
    'import.duplicates': {
        one: 'Пропущено {count} повтор.',
        few: 'Пропущено {count} повтори.',
        many: 'Пропущено {count} повторів.',
        other: 'Пропущено {count} повтору.',
    },
    'import.error.not-xlsx': 'Це не файл .xlsx. Збережіть таблицю у форматі Excel (.xlsx) і спробуйте ще раз.',
    'import.error.unreadable': 'Не вдалося прочитати файл. Можливо, він пошкоджений або захищений паролем.',
    'import.error.no-sheet': 'У файлі немає жодного аркуша.',
    'import.error.no-rows':
        'У файлі немає жодного рядка, де заповнені і слово (стовпець B), і переклад (стовпець C).',
    'import.error.library-missing':
        'Не вдалося завантажити модуль читання таблиць. Перевірте з’єднання й спробуйте ще раз.',
    'import.error.read': 'Не вдалося відкрити файл.',
    'import.kept': 'Попередній список слів залишився без змін.',
    'storage.unavailable':
        'Браузер не дозволяє зберігати дані, тож після закриття сторінки список доведеться завантажити знову.',
    'storage.full':
        'Список завеликий, щоб браузер його запам’ятав. Зараз ним можна користуватися, але після закриття сторінки його доведеться завантажити знову.',
    'mode.flashcards': 'Картки',
    'mode.flashcards.hint': 'Переверніть картку й чесно оцініть себе',
    'mode.choice': 'Вибір варіанта',
    'mode.choice.hint': 'Оберіть правильну відповідь серед чотирьох',
    'mode.matching': 'Пари',
    'mode.matching.hint': 'Зіставте слова з перекладами',

    'session.finish': 'Завершити',
    'session.score': 'Правильно: {correct}, помилок: {wrong}',
    'speak': 'Озвучити',

    'flash.tapToFlip': 'Торкніться картки, щоб побачити відповідь',
    'flash.know': 'Знаю',
    'flash.dontKnow': 'Не знаю',
    'flash.keys': 'Пробіл — перевернути · 1 — знаю · 2 — не знаю · Esc — завершити',

    'choice.next': 'Далі',
    'choice.correct': 'Правильно',
    'choice.wrong': 'Неправильно. Правильна відповідь: {answer}',
    'choice.keys': '1–{count} — варіант · Пробіл — далі · Esc — завершити',

    'matching.prompts': 'Питання',
    'matching.answers': 'Відповіді',
    'matching.matched': 'Пару знайдено: {prompt} — {answer}',
    'matching.wrong': 'Не пара',
    'matching.keys': 'Esc — завершити',

    'stats.title': 'Підсумок',
    'stats.total': 'Відповідей',
    'stats.correct': 'Правильно',
    'stats.wrong': 'Помилок',
    'stats.accuracy': 'Точність',
    'stats.mistakes': 'Слова з помилками',
    'stats.noMistakes': 'Жодної помилки. Чудово!',
    'stats.noAnswers': 'Цього разу відповідей не було.',
    'stats.times': '×{count}',
    'stats.newSession': 'Нова сесія',
    'stats.retryMistakes': 'Повторити помилки',
    'stats.menu': 'До меню',
};
