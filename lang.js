window.sokkai = window.sokkai || {};

sokkai.lang = (
    function () {

        let messageSet;

        const MESSAGES_JA = {
            ROOMNAME_FORM: '接続したいルームを入力します。空欄のままでは、ルーム「default」に接続されます。',
            ROOMNAME_PH: 'ルーム',
            GET_ROOM_LIST: '部屋一覧',
            ACTIVE_ROOMS: 'アクティブルーム',
            USERNAME_FORM: 'ユーザー名を入力してください。空欄のままだとランダムなユーザーネームが割り当てられます。',
            USERNAME_PH: 'ユーザー名',
            SUBMIT: '送信',
            CLEAR: '消す',
            TOGGLE_SOUND_ON: '音： オン',
            TOGGLE_SOUND_OFF: '音： オフ',
            TOGGLE_SOUND_POP: '音：ポップ',
            TOGGLE_SOUND_BUZZ: '音：バズ',
            TOGGLE_INFO_HIDE: '情報を隠す',
            TOGGLE_INFO_SHOW: '情報を表示する',
            TOGGLE_HISTORY_HIDE: '履歴を隠す',
            TOGGLE_HISTORY_SHOW: '履歴を表示する',
            RECONNECT: '再接続',
            USERS: 'ユーザー',
            HISTORY: '履歴',
            CLEAR_HISTORY: '履歴を消去する',
            NO_ACTIVE_ROOMS: 'アクティブルームがない',
            HAS_JOINED: 'が部屋に入った。',
            JOINED: 'が入った。',
            HAS_LEFT: 'が部屋を出た。',
            LEFT: 'が出た。',
            REFRESH_LIST: 'リストを更新する',
            LOCKED: 'ロック',
            BUZZ: 'バズ',
            BUZZED: 'がバズを押した',
            YOUR_BUZZ: '出番',
            INVALID_USERNAME: '効な名前、またはユーザー名がすでに使われている。',
            ROOM_FULL: 'という名前の部屋は現在満室です。後でもう一度試すか、他の部屋を選んでください。',
            SELECT_LANGUAGE: '言語設定',
            DISCONNECTED: '切断された - 再接続中'
        };


        const MESSAGES_EN = {
            ROOMNAME_FORM: 'Enter the room you would like to connect to. Leaving this blank will connect you to room "default"',
            ROOMNAME_PH: 'Room name',
            GET_ROOM_LIST: 'Get Room List',
            ACTIVE_ROOMS: 'Active Rooms',
            USERNAME_FORM: 'Enter your username. Leaving this blank will assign you a random username.',
            USERNAME_PH: 'Username',
            SUBMIT: 'Submit',
            CLEAR: 'Clear',
            TOGGLE_SOUND_ON: 'Sound: ON',
            TOGGLE_SOUND_OFF: 'Sound: OFF',
            TOGGLE_SOUND_POP: 'Sound: Pop',
            TOGGLE_SOUND_BUZZ: 'Sound: Buzz',
            TOGGLE_INFO_HIDE: 'Hide Info',
            TOGGLE_INFO_SHOW: 'Show Info',
            TOGGLE_HISTORY_HIDE: 'Hide History',
            TOGGLE_HISTORY_SHOW: 'Show History',
            RECONNECT: 'Reconnect',
            USERS: 'Users',
            HISTORY: 'History',
            CLEAR_HISTORY: 'Clear history',
            NO_ACTIVE_ROOMS: 'No active rooms',
            HAS_JOINED: ' has joined.',
            JOINED: ' joined',
            HAS_LEFT: ' has left the room',
            LEFT: ' left',
            REFRESH_LIST: 'Refresh List',
            LOCKED: 'LOCKED',
            BUZZ: 'BUZZ',
            BUZZED: ' buzzed',
            YOUR_BUZZ: 'YOUR BUZZ',
            INVALID_USERNAME: 'Invalid name or username already taken',
            ROOM_FULL: ' is currently full. Try again later or choose another room.',
            SELECT_LANGUAGE: 'Language',
            DISCONNECTED: 'Disconnected - Reconnecting...'
        }

        if (/^ja\b/.test(navigator.language)) {
            messageSet = MESSAGES_JA;
        } else {
            messageSet = null;
        }

        _setLanguage();

        function getMessage(msgKey, defaultMsg) {
            if (msgKey && messageSet && messageSet.hasOwnProperty(msgKey)) {
                return messageSet[msgKey];
            } else {
                return defaultMsg;
            }
        }

        function changeLanguage(targetLang) {
            if (targetLang === "JP") {
                messageSet = MESSAGES_JA;
            } else if (targetLang === "EN") {
                messageSet = MESSAGES_EN;
            }

            _setLanguage();
        }

        function _setLanguage() {
            if (messageSet) {

                //First, process data-text nodes
                $('[data-text]').each(function () {
                    let el = $(this);
                    let msgKey = el.attr('data-text');
                    if (msgKey && messageSet.hasOwnProperty(msgKey)) {
                        el.text(messageSet[msgKey]);
                    }
                });

                //Next, process data-text-placeholder nodes
                $('[data-text-placeholder]').each(function () {
                    let el = $(this);
                    let msgKey = el.attr('data-text-placeholder');
                    if (msgKey && messageSet.hasOwnProperty(msgKey)) {
                        el.attr('placeholder', messageSet[msgKey]);
                    }
                });

            }
        }

        return {
            messageSet: messageSet,
            getMessage: getMessage,
            changeLanguage: changeLanguage
        }

    }()
);

