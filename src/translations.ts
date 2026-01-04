export type Language = 'en' | 'fa';

export interface Translations {
    // UI Labels
    title: string;
    subtitle: string;
    treeOrder: string;
    orderPlaceholder: string;
    enterValue: string;
    insert: string;
    delete: string;
    search: string;
    clear: string;
    random: string;
    randomCount: string;
    tip: string;
    tipText: string;
    
    // Status Messages
    ready: string;
    valueInserted: string;
    valueDeleted: string;
    valueFound: string;
    valueNotFound: string;
    error: string;
    treeCleared: string;
    orderChanged: string;
    orderReorganized: string;
    orderMustBeAtLeast: string;
    pleaseEnterValidNumber: string;
    insertingRandomValues: string;
    
    // Step-by-step messages
    startingInsertion: string;
    beginningSearch: string;
    keyAlreadyExists: string;
    reachedLeafNode: string;
    atInternalNode: string;
    comparing: string;
    followingChild: string;
    leftmost: string;
    afterKey: string;
    keyFound: string;
    keyNotFound: string;
    searchSuccessful: string;
    searchUnsuccessful: string;
    foundLeafBeforeInsertion: string;
    insertingIntoLeaf: string;
    leafNodeFull: string;
    splittingLeafNode: string;
    leftNode: string;
    rightNode: string;
    promotingKey: string;
    noParentExists: string;
    creatingNewRoot: string;
    treeHeightIncreased: string;
    insertingPromotedKey: string;
    insertingKeyIntoInternal: string;
    atPosition: string;
    currentKeys: string;
    keyInserted: string;
    newKeys: string;
    checkingIfSplitNeeded: string;
    internalNodeFull: string;
    splittingInternalNode: string;
    left: string;
    right: string;
    internalNodeHasKeys: string;
    withinLimit: string;
    insertionComplete: string;
    
    // Canvas labels
    leaf: string;
    internal: string;
    treeIsEmpty: string;
    
    // Step controls
    step: string;
    of: string;
    first: string;
    previous: string;
    play: string;
    pause: string;
    next: string;
    last: string;
    close: string;
    stepExplanation: string;
    noExplanationAvailable: string;
}

export const translations: Record<Language, Translations> = {
    en: {
        title: 'B+ Tree Visual Simulator',
        subtitle: 'Interactive visualization of B+ tree operations',
        treeOrder: 'Order:',
        orderPlaceholder: 'Min 3',
        enterValue: 'Enter value',
        insert: 'Insert',
        delete: 'Delete',
        search: 'Search',
        clear: 'Clear',
        random: 'Random',
        randomCount: '(10)',
        tip: 'Tip:',
        tipText: 'Hold Shift while clicking Insert or Search for step-by-step mode',
        
        ready: 'Ready. Enter a value and click Insert, Delete, or Search. Hold Shift for step-by-step mode.',
        valueInserted: 'Value {value} inserted successfully.',
        valueDeleted: 'Value {value} deleted successfully.',
        valueFound: 'Value {value} found in the tree.',
        valueNotFound: 'Value {value} not found in the tree.',
        error: 'Error:',
        treeCleared: 'Tree cleared.',
        orderChanged: 'Tree order changed to {order}.',
        orderReorganized: 'Tree reorganized with {count} key{plural}.',
        orderMustBeAtLeast: 'Order must be at least 3.',
        pleaseEnterValidNumber: 'Please enter a valid number.',
        insertingRandomValues: 'Inserting 10 random values: {values}',
        
        startingInsertion: 'Starting insertion of key {key}. Beginning search from root.',
        beginningSearch: 'Beginning search from root.',
        keyAlreadyExists: 'Key {key} already exists in the tree. Insertion aborted.',
        reachedLeafNode: 'Reached leaf node with keys [{keys}].',
        atInternalNode: 'At internal node with keys [{keys}].',
        comparing: 'Comparing {key} with keys.',
        followingChild: 'Following child {index}.',
        leftmost: 'leftmost',
        afterKey: 'after key {key}',
        keyFound: 'Key {key} found!',
        keyNotFound: 'Key {key} not found in keys [{keys}].',
        searchSuccessful: 'Search successful.',
        searchUnsuccessful: 'Search unsuccessful.',
        foundLeafBeforeInsertion: 'Found leaf node with keys [{keys}]. Inserting key {key}.',
        insertingIntoLeaf: 'Inserting key {key} into leaf node.',
        leafNodeFull: 'Leaf node is full ({count} keys, max {max}). Splitting leaf node...',
        splittingLeafNode: 'Split leaf node. Left node: [{left}], Right node: [{right}]. Promoting key {key} to parent.',
        leftNode: 'Left node:',
        rightNode: 'Right node:',
        promotingKey: 'Promoting key {key}.',
        noParentExists: 'No parent exists.',
        creatingNewRoot: 'Creating new root with key {key}.',
        treeHeightIncreased: 'Tree height increased.',
        insertingPromotedKey: 'Inserting promoted key {key} into parent node with keys [{keys}].',
        insertingKeyIntoInternal: 'Inserting key {key} into internal node at position {position}.',
        atPosition: 'at position',
        currentKeys: 'Current keys:',
        keyInserted: 'Key {key} inserted.',
        newKeys: 'New keys:',
        checkingIfSplitNeeded: 'Checking if split is needed...',
        internalNodeFull: 'Internal node is full ({count} keys, max {max}). Splitting internal node...',
        splittingInternalNode: 'Split internal node. Left: [{left}], Right: [{right}].',
        left: 'Left:',
        right: 'Right:',
        internalNodeHasKeys: 'Internal node has {count} keys',
        withinLimit: '(within limit).',
        insertionComplete: 'Insertion complete!',
        
        leaf: 'Leaf',
        internal: 'Internal',
        treeIsEmpty: 'Tree is empty',
        
        step: 'Step',
        of: 'of',
        first: 'First',
        previous: 'Previous',
        play: 'Play',
        pause: 'Pause',
        next: 'Next',
        last: 'Last',
        close: 'Close',
        stepExplanation: 'Step Explanation',
        noExplanationAvailable: 'No explanation available.'
    },
    fa: {
        title: 'شبیه‌ساز بصری درخت B+',
        subtitle: 'تجسم تعاملی عملیات درخت B+',
        treeOrder: 'ترتیب:',
        orderPlaceholder: 'حداقل ۳',
        enterValue: 'مقدار را وارد کنید',
        insert: 'درج',
        delete: 'حذف',
        search: 'جستجو',
        clear: 'پاک کردن',
        random: 'تصادفی',
        randomCount: '(۱۰)',
        tip: 'نکته:',
        tipText: 'برای حالت گام‌به‌گام، هنگام کلیک روی درج یا جستجو، Shift را نگه دارید',
        
        ready: 'آماده است. یک مقدار وارد کنید و روی درج، حذف یا جستجو کلیک کنید. برای حالت گام‌به‌گام Shift را نگه دارید.',
        valueInserted: 'مقدار {value} با موفقیت درج شد.',
        valueDeleted: 'مقدار {value} با موفقیت حذف شد.',
        valueFound: 'مقدار {value} در درخت پیدا شد.',
        valueNotFound: 'مقدار {value} در درخت پیدا نشد.',
        error: 'خطا:',
        treeCleared: 'درخت پاک شد.',
        orderChanged: 'ترتیب درخت به {order} تغییر یافت.',
        orderReorganized: 'درخت با {count} کلید{plural} بازسازی شد.',
        orderMustBeAtLeast: 'ترتیب باید حداقل ۳ باشد.',
        pleaseEnterValidNumber: 'لطفاً یک عدد معتبر وارد کنید.',
        insertingRandomValues: 'در حال درج ۱۰ مقدار تصادفی: {values}',
        
        startingInsertion: 'شروع درج کلید {key}. شروع جستجو از ریشه.',
        beginningSearch: 'شروع جستجو از ریشه.',
        keyAlreadyExists: 'کلید {key} از قبل در درخت وجود دارد. درج لغو شد.',
        reachedLeafNode: 'رسیدن به گره برگ با کلیدهای [{keys}].',
        atInternalNode: 'در گره داخلی با کلیدهای [{keys}].',
        comparing: 'مقایسه {key} با کلیدها.',
        followingChild: 'دنبال کردن فرزند {index}.',
        leftmost: 'چپ‌ترین',
        afterKey: 'بعد از کلید {key}',
        keyFound: 'کلید {key} پیدا شد!',
        keyNotFound: 'کلید {key} در کلیدهای [{keys}] پیدا نشد.',
        searchSuccessful: 'جستجو موفق بود.',
        searchUnsuccessful: 'جستجو ناموفق بود.',
        foundLeafBeforeInsertion: 'گره برگ با کلیدهای [{keys}] پیدا شد. در حال درج کلید {key}.',
        insertingIntoLeaf: 'در حال درج کلید {key} در گره برگ.',
        leafNodeFull: 'گره برگ پر است ({count} کلید، حداکثر {max}). در حال تقسیم گره برگ...',
        splittingLeafNode: 'تقسیم گره برگ. گره چپ: [{left}]، گره راست: [{right}]. ارتقای کلید {key} به والد.',
        leftNode: 'گره چپ:',
        rightNode: 'گره راست:',
        promotingKey: 'ارتقای کلید {key}.',
        noParentExists: 'والدی وجود ندارد.',
        creatingNewRoot: 'ایجاد ریشه جدید با کلید {key}.',
        treeHeightIncreased: 'ارتفاع درخت افزایش یافت.',
        insertingPromotedKey: 'در حال درج کلید ارتقا یافته {key} در گره والد با کلیدهای [{keys}].',
        insertingKeyIntoInternal: 'در حال درج کلید {key} در گره داخلی در موقعیت {position}.',
        atPosition: 'در موقعیت',
        currentKeys: 'کلیدهای فعلی:',
        keyInserted: 'کلید {key} درج شد.',
        newKeys: 'کلیدهای جدید:',
        checkingIfSplitNeeded: 'بررسی نیاز به تقسیم...',
        internalNodeFull: 'گره داخلی پر است ({count} کلید، حداکثر {max}). در حال تقسیم گره داخلی...',
        splittingInternalNode: 'تقسیم گره داخلی. چپ: [{left}]، راست: [{right}].',
        left: 'چپ:',
        right: 'راست:',
        internalNodeHasKeys: 'گره داخلی {count} کلید دارد',
        withinLimit: '(در محدوده).',
        insertionComplete: 'درج کامل شد!',
        
        leaf: 'برگ',
        internal: 'داخلی',
        treeIsEmpty: 'درخت خالی است',
        
        step: 'گام',
        of: 'از',
        first: 'اول',
        previous: 'قبلی',
        play: 'پخش',
        pause: 'توقف',
        next: 'بعدی',
        last: 'آخر',
        close: 'بستن',
        stepExplanation: 'توضیح گام',
        noExplanationAvailable: 'توضیحی در دسترس نیست.'
    }
};

export function t(key: keyof Translations, lang: Language, params?: Record<string, string | number>): string {
    let text = translations[lang][key];
    
    if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
            text = text.replace(`{${paramKey}}`, String(paramValue));
        }
    }
    
    return text;
}

