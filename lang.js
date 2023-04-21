window.sokkai = window.sokkai || {};

sokkai.lang = (
    function () {

        let messageSet;

        const MESSAGES_JA = {
            ROOMNAME_FORM: 'まず、ルームに参加するか、ルームを作成する必要があります。以下から選択してください。',
            ROOMNAME_PH: 'ルーム',
            USERNAME_FORM: 'ユーザー名を入力してください。空欄のままだとランダムなユーザーネームが割り当てられます。',
            USERNAME_PH: 'ユーザー名',
            SUBMIT: '送信',
            CLEAR: '消す',
            TOGGLE_SOUND_ON: '音： オン',
            TOGGLE_SOUND_OFF: '音： オフ',
            TOGGLE_SOUND_POP: '音：ポップ',
            TOGGLE_SOUND_BUZZ: '音：ブーン',
            TOGGLE_INFO_HIDE: '情報を隠す',
            TOGGLE_INFO_SHOW: '情報を表示する',
            TOGGLE_HISTORY_HIDE: '履歴を隠す',
            TOGGLE_HISTORY_SHOW: '履歴を表示する',
            RECONNECT: '再接続',
            USERS: 'ユーザー',
            HISTORY: '履歴',
            CLEAR_HISTORY: '履歴を消去する',
            HAS_JOINED: 'が部屋に入った。',
            JOINED: 'が入った。',
            HAS_LEFT: 'が部屋を出た。',
            LEFT: 'が出た。',
            LOCKED: 'ロック',
            BUZZ: 'ブーン',
            BUZZED: 'がブーンを押した',
            YOUR_BUZZ: '出番',
            INVALID_USERNAME: '効な名前、またはユーザー名がすでに使われている。',
            NULL_ROOMNAME: 'ルームを入力する必要があります。',
            NO_SUCH_ROOM: '入力された部屋は存在しません。',
            ROOM_TAKEN: 'その部屋名はすでに使用されています。代わりにランダムなルームコードを生成しました。',
            ROOM_FULL: 'という名前の部屋は現在満室です。後でもう一度試すか、他の部屋を選んでください。',
            SELECT_LANGUAGE: '言語設定',
            DISCONNECTED: '切断された - 再接続中',
            CREATE_ROOM: '作成',
            JOIN_ROOM: '参加',
            ALREADY_CONNECTED: "すでに接続されていますので、再接続の必要はありません。問題が発生した場合は、ページを更新して再度ルームに参加してください。"
        };


        const MESSAGES_EN = {
            ROOMNAME_FORM: 'You must first join or create a room. Please choose an option below.',
            ROOMNAME_PH: 'Room name',
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
            HAS_JOINED: ' has joined.',
            JOINED: ' joined',
            HAS_LEFT: ' has left the room',
            LEFT: ' left',
            LOCKED: 'LOCKED',
            BUZZ: 'BUZZ',
            BUZZED: ' buzzed',
            YOUR_BUZZ: 'YOUR BUZZ',
            INVALID_USERNAME: 'Invalid name or username already taken',
            NULL_ROOMNAME: 'You must enter a room name!',
            NO_SUCH_ROOM: 'The room you inputted does not exist.',
            ROOM_TAKEN: "That room name was already taken. We generated a random room code for you instead.",
            ROOM_FULL: ' is currently full. Try again later or choose another room.',
            SELECT_LANGUAGE: 'Language',
            DISCONNECTED: 'Disconnected - Reconnecting...',
            JOIN_ROOM: "Join",
            CREATE_ROOM: "Create",
            ALREADY_CONNECTED: "You are already connected and don't need to reconnect. If you are experiencing issues, please refresh the page and join the room again."
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

