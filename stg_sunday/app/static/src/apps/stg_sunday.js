document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.querySelector('.stg-sunday-wrapper');
    if (!wrapper) {
        return;
    }

    const boardsEndpoint = wrapper.dataset.endpointBoards;
    const boardListEl = wrapper.querySelector('[data-board-list]');
    const boardSidebarEl = wrapper.querySelector('[data-board-sidebar]');
    const boardSidebarList = wrapper.querySelector('[data-board-sidebar-list]');
    const summaryGroupsEl = wrapper.querySelector('[data-summary-groups]');
    const summaryItemsEl = wrapper.querySelector('[data-summary-items]');
    const boardTitleEl = wrapper.querySelector('[data-board-title]');
    const boardSubtitleEl = wrapper.querySelector('[data-board-subtitle]');
    const modalOverlay = wrapper.querySelector('[data-modal-overlay]');
    const modalCreateBoard = document.getElementById('modal-create-board');
    const modalCreateGroup = document.getElementById('modal-create-group');
    const modalManageColumn = document.getElementById('modal-manage-column');
    const modalCreateItem = document.getElementById('modal-create-item');
    const observationSidebar = wrapper.querySelector('[data-observation-sidebar]');

    const formCreateBoard = modalCreateBoard?.querySelector('[data-form-create-board]');
    const formCreateGroup = modalCreateGroup?.querySelector('[data-form-create-group]');
    const formManageColumn = modalManageColumn?.querySelector('[data-form-manage-column]');
    const formCreateItem = modalCreateItem?.querySelector('[data-form-create-item]');
    const formObservation = observationSidebar?.querySelector('[data-form-observation]');

    const columnModalTitle = modalManageColumn?.querySelector('[data-column-modal-title]');
    const columnBoardIdInput = modalManageColumn?.querySelector('[data-column-board-id]');
    const columnIdInput = modalManageColumn?.querySelector('[data-column-id]');
    const columnTypeSelect = modalManageColumn?.querySelector('[data-column-type]');
    const columnLabelsSection = modalManageColumn?.querySelector('[data-column-labels]');
    const columnLabelList = modalManageColumn?.querySelector('[data-label-list]');
    const columnSubmitButton = modalManageColumn?.querySelector('[data-column-submit]');

    const itemBoardIdInput = modalCreateItem?.querySelector('[data-item-board-id]');
    const itemGroupIdInput = modalCreateItem?.querySelector('[data-item-group-id]');

    const observationComments = observationSidebar?.querySelector('[data-observation-comments]');
    const observationTitle = observationSidebar?.querySelector('[data-observation-title]');
    const observationSubtitle = observationSidebar?.querySelector('[data-observation-subtitle]');
    const observationCount = observationSidebar?.querySelector('[data-observation-count]');
    const observationTabCount = observationSidebar?.querySelector('[data-observation-tab-count]');
    const observationSubscribers = observationSidebar?.querySelector('[data-observation-subscribers]');
    const observationEditor = observationSidebar?.querySelector('[data-observation-editor]');
    const observationToolbar = observationSidebar?.querySelector('[data-observation-toolbar]');
    const confirmModal = document.getElementById('modal-confirm');
    const confirmTitleEl = confirmModal?.querySelector('[data-confirm-title]');
    const confirmMessageEl = confirmModal?.querySelector('[data-confirm-message]');
    const confirmCancelBtn = confirmModal?.querySelector('[data-confirm-cancel]');
    const confirmOkBtn = confirmModal?.querySelector('[data-confirm-ok]');
    const logoImg = wrapper.querySelector('.sunday-logo img');
    const currentUser = {
        id: wrapper.dataset.currentUserId ? Number(wrapper.dataset.currentUserId) : null,
        username: wrapper.dataset.currentUserUsername || 'Colaborador',
        fullName: wrapper.dataset.currentUserFullname || wrapper.dataset.currentUserUsername || 'Colaborador',
        avatar: wrapper.dataset.currentUserAvatar || '',
    };

    if (boardTitleEl) {
        boardTitleEl.dataset.action = 'rename-board';
        boardTitleEl.tabIndex = 0;
        boardTitleEl.classList.add('is-editable');
        boardTitleEl.setAttribute('title', 'Clique para editar o nome do quadro');
        boardTitleEl.addEventListener('keydown', (event) => {
            if ((event.key === 'Enter' || event.key === ' ') && !boardTitleEl.classList.contains('is-editing')) {
                event.preventDefault();
                startInlineBoardRename();
            }
        });
    }

    const updateLogoForTheme = () => {
        if (!logoImg) {
            return;
        }
        const isDark = document.body.classList.contains('dark');
        const targetSrc = isDark
            ? (logoImg.dataset.logoDark || logoImg.src)
            : (logoImg.dataset.logoLight || logoImg.dataset.logoDark || logoImg.src);
        if (targetSrc && logoImg.getAttribute('src') !== targetSrc) {
            logoImg.setAttribute('src', targetSrc);
        }
    };

    updateLogoForTheme();
    let themeObserver = null;
    if (logoImg) {
        themeObserver = new MutationObserver(updateLogoForTheme);
        themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        window.addEventListener('beforeunload', () => themeObserver?.disconnect(), { once: true });
    }

    const ICON_BOARD = '<svg class="sunday-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>';
    const ICON_TABLE = '<svg class="sunday-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><polyline points="3 12 5 12 21 12"></polyline><polyline points="3 18 5 18 21 18"></polyline></svg>';
    const ICON_ITEM = '<svg class="sunday-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M4.93 4.93l1.41 1.41"></path><path d="M17.66 17.66l1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="M6.34 17.66l-1.41 1.41"></path><path d="M19.07 4.93l-1.41 1.41"></path></svg>';
    const ICON_MORE = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>';
    const ICON_ROW_HANDLE = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v7"/><path d="M9 2v8"/><path d="M12 3v8"/><path d="M4 5v7"/><path d="M4 7l-2 2 2 2"/><path d="M4 12c0 3 8 3 8 0v-2"/></svg>';
    const ICON_RESIZE = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 12 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4L1 8l3 4"/><path d="M8 4l3 4-3 4"/><path d="M6 3v10"/></svg>';
    const DEFAULT_STATUS_LABELS = [
        { id: 'status-new', text: 'Novo', color: '#4c6ef5' },
        { id: 'status-progress', text: 'Em andamento', color: '#21d4fd' },
        { id: 'status-done', text: 'Concluído', color: '#43cea2' },
        { id: 'status-late', text: 'Atrasado', color: '#ff6b6b' },
    ];
    let pendingConfirmResolve = null;
    let pendingConfirmCleanup = null;

    let boardsCache = [];
    let activeBoardId = null;
    let currentBoard = null;
    let columnModalMode = 'create';
    let columnModalColumnId = null;
    let currentBoardMenu = null;
    let currentColumnMenu = null;
    let currentGroupMenu = null;
    let currentGroupMenuHandler = null;
    let currentLabelPicker = null;
    let currentLabelPickerHandler = null;
    let currentInlineEditor = null;
    let currentInlineEditorHandler = null;
    let currentInlineEditorCell = null;
    let currentInlineEditorPreviousNodes = null;
    let observationState = null;
    let recentlyAddedGroupId = null;
    let recentlyAddedColumnId = null;
    let recentlyAddedItemId = null;
    let tableScrollCleanups = [];
    let sharedScrollbar = null;
    let sharedScrollbarInner = null;
    let sharedActiveTable = null;
    let sharedActiveViewport = null;
    const registeredTables = new Set();
    let sharedSyncingFromTable = false;
    let sharedSyncingFromBar = false;
    const selectedRows = new Map();
    const columnWidthState = new Map();
    let currentOrderedColumns = [];
    let currentGridTemplate = '';
    let observationColumns = [];
    let reorderableColumns = [];
    const COLUMN_MIN_WIDTH = 180;
    const COLUMN_MAX_WIDTH = 520;
    const COLUMN_DEFAULT_WIDTH = 260;
    let activeColumnResize = null;
    let columnDragState = null;
    let columnDragAvatar = null;
    let rowDragState = null;
    let rowDragAvatar = null;
    let currentCommentMenu = null;
    let currentCommentMenuHandler = null;

    async function fetchJSON(url, options) {
        const response = await fetch(url, options);
        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(`Erro ${response.status}: ${text}`);
        }
        return response.json();
    }

    function showToast(message) {
        let toast = document.querySelector('.sunday-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'sunday-toast';
            toast.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 16h-1v-4h-1"></path><path d="M12 8h.01"></path><path d="M21 12a9 9 0 1 1-9-9"></path></svg><span></span>';
            document.body.appendChild(toast);
        }
        toast.querySelector('span').textContent = message;
        toast.classList.add('is-visible');
        setTimeout(() => toast.classList.remove('is-visible'), 2600);
    }

    function escapeHTML(value = '') {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        };
        return String(value).replace(/[&<>"']/g, (match) => map[match]);
    }

    function hashString(value = '') {
        const str = String(value);
        let hash = 0;
        for (let i = 0; i < str.length; i += 1) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    function getAvatarColors(seed = 'default') {
        const palette = [
            ['#4c6ef5', '#ffffff'],
            ['#f08c00', '#1b1b1f'],
            ['#21d4fd', '#0b2941'],
            ['#ff6b6b', '#1b1b1f'],
            ['#6a4c93', '#ffffff'],
            ['#2ed573', '#08331d'],
            ['#f72585', '#ffffff'],
        ];
        const index = hashString(seed) % palette.length;
        const [background, color] = palette[index];
        return { background, color };
    }

    function getInitials(value = '') {
        const initials = value
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase();
        return initials || 'US';
    }

    function formatObservationDate(value) {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '';
        }
        return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    }

    function getCommentAuthor(comment) {
        if (!comment) {
            return currentUser.fullName;
        }
        if (comment.author_name) {
            return comment.author_name;
        }
        if (comment.author_username) {
            return comment.author_username;
        }
        if (comment.author_id && currentUser.id && comment.author_id === currentUser.id) {
            return currentUser.fullName;
        }
        if (comment.author_id) {
            return `Usuário ${comment.author_id}`;
        }
        return currentUser.fullName;
    }

    function enhanceCommentAuthorMetadata(comment) {
        if (!comment) {
            return comment;
        }
        if (!comment.author_name && comment.author_id && currentUser.id && comment.author_id === currentUser.id) {
            comment.author_name = currentUser.fullName;
        }
        if (!comment.author_username && comment.author_id && currentUser.id && comment.author_id === currentUser.id) {
            comment.author_username = currentUser.username;
        }
        if (!comment.author_avatar && comment.author_id && currentUser.id && comment.author_id === currentUser.id && currentUser.avatar) {
            comment.author_avatar = currentUser.avatar;
        }
        comment.is_pinned = Boolean(comment.is_pinned);
        if (!comment.created_at) {
            comment.created_at = new Date().toISOString();
        }
        return comment;
    }

    function renderRichText(value = '') {
        if (!value) {
            return '';
        }
        let html = escapeHTML(value);
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.+?)__/g, '<u>$1</u>');
        html = html.replace(/_(.+?)_/g, '<em>$1</em>');
        html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        const lines = html.split(/\n/);
        const blocks = [];
        let listType = null;
        let listBuffer = [];

        const flushList = () => {
            if (!listType || !listBuffer.length) {
                listType = null;
                listBuffer = [];
                return;
            }
            blocks.push(`<${listType}>${listBuffer.join('')}</${listType}>`);
            listType = null;
            listBuffer = [];
        };

        lines.forEach((line) => {
            const trimmed = line.trim();
            const isUnordered = /^[-*]\s+/.test(trimmed);
            const isOrdered = /^\d+\.\s+/.test(trimmed);

            if (isUnordered || isOrdered) {
                const nextType = isOrdered ? 'ol' : 'ul';
                if (listType && listType !== nextType) {
                    flushList();
                }
                if (!listType) {
                    listType = nextType;
                }
                const itemContent = trimmed.replace(/^(\d+\.\s+|[-*]\s+)/, '') || '&nbsp;';
                listBuffer.push(`<li>${itemContent}</li>`);
            } else {
                flushList();
                const safeLine = line.length ? line : '<br>';
                blocks.push(`<p>${safeLine}</p>`);
            }
        });

        flushList();
        return blocks.join('');
    }

    function sortObservationComments(comments = []) {
        return [...comments].sort((a, b) => {
            const pinDiff = Number(b.is_pinned) - Number(a.is_pinned);
            if (pinDiff !== 0) {
                return pinDiff;
            }
            const aDate = new Date(a.created_at || 0).getTime();
            const bDate = new Date(b.created_at || 0).getTime();
            return bDate - aDate;
        });
    }

    function getActiveObservationContext() {
        if (!currentBoard || !observationState) {
            return null;
        }
        return getCellById(currentBoard, observationState.cellId);
    }

    function closeCommentMenu() {
        if (currentCommentMenuHandler) {
            document.removeEventListener('click', currentCommentMenuHandler, true);
            currentCommentMenuHandler = null;
        }
        currentCommentMenu?.remove();
        currentCommentMenu = null;
    }

    function openCommentMenu(trigger, comment) {
        if (!trigger || !comment) {
            return;
        }
        closeCommentMenu();
        const menu = document.createElement('div');
        menu.className = 'observation-comment-menu';
        const actionLabel = comment.is_pinned ? 'Desafixar do topo' : 'Fixar no topo';
        const actionType = comment.is_pinned ? 'unpin-comment' : 'pin-comment';
        menu.innerHTML = `
            <button type="button" data-action="${actionType}" data-comment-id="${comment.id}">${actionLabel}</button>
            <button type="button" data-action="delete-comment" data-comment-id="${comment.id}">Excluir atualização</button>
        `;
        wrapper.appendChild(menu);
        const rect = trigger.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        let left = rect.left;
        let top = rect.bottom + 6;
        if (left + menuRect.width > window.innerWidth - 16) {
            left = window.innerWidth - menuRect.width - 16;
        }
        if (top + menuRect.height > window.innerHeight - 16) {
            top = rect.top - menuRect.height - 6;
        }
        menu.style.left = `${Math.max(16, left)}px`;
        menu.style.top = `${Math.max(16, top)}px`;

        currentCommentMenuHandler = (event) => {
            if (!menu.contains(event.target) && event.target !== trigger) {
                closeCommentMenu();
            }
        };
        document.addEventListener('click', currentCommentMenuHandler, true);
        currentCommentMenu = menu;
    }

    function insertTextAtEditor(text, { replaceSelection = true } = {}) {
        if (!observationEditor) {
            return;
        }
        const start = observationEditor.selectionStart ?? observationEditor.value.length;
        const end = observationEditor.selectionEnd ?? observationEditor.value.length;
        const before = observationEditor.value.slice(0, start);
        const after = observationEditor.value.slice(replaceSelection ? end : start);
        observationEditor.value = `${before}${text}${after}`;
        const cursor = before.length + text.length;
        observationEditor.focus();
        observationEditor.setSelectionRange(cursor, cursor);
    }

    function applyFormatToEditor(format) {
        if (!observationEditor || !format) {
            return;
        }
        const start = observationEditor.selectionStart ?? 0;
        const end = observationEditor.selectionEnd ?? 0;
        const value = observationEditor.value;
        const selected = value.slice(start, end);
        const fallback = selected || 'texto';

        if (format === 'bold' || format === 'italic' || format === 'underline') {
            const wrapper = format === 'bold' ? '**' : format === 'italic' ? '_' : '__';
            const newValue = `${value.slice(0, start)}${wrapper}${fallback}${wrapper}${value.slice(end)}`;
            observationEditor.value = newValue;
            const offset = wrapper.length;
            observationEditor.focus();
            observationEditor.setSelectionRange(start + offset, start + offset + fallback.length);
            return;
        }

        if (format === 'ordered-list' || format === 'unordered-list') {
            const prefix = format === 'ordered-list' ? '1. ' : '- ';
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const newValue = `${value.slice(0, lineStart)}${prefix}${value.slice(lineStart)}`;
            observationEditor.value = newValue;
            const cursor = end + prefix.length;
            observationEditor.focus();
            observationEditor.setSelectionRange(cursor, cursor);
            return;
        }

        if (format === 'link') {
            const url = window.prompt('Informe o link (ex.: https://exemplo.com):');
            if (!url) {
                return;
            }
            const markdown = `[${fallback}](${url})`;
            const newValue = `${value.slice(0, start)}${markdown}${value.slice(end)}`;
            observationEditor.value = newValue;
            const cursor = start + markdown.length;
            observationEditor.focus();
            observationEditor.setSelectionRange(cursor, cursor);
        }
    }

    function updateObservationButtonCount(cell) {
        if (!cell) {
            return;
        }
        const button = boardListEl.querySelector(`button[data-cell-id="${cell.id}"] span`);
        if (button) {
            button.textContent = String(cell.comments?.length || 0);
        }
    }

    observationToolbar?.addEventListener('click', (event) => {
        const formatButton = event.target.closest('[data-format]');
        if (formatButton) {
            event.preventDefault();
            applyFormatToEditor(formatButton.dataset.format);
        }
    });

    observationSidebar?.addEventListener('click', (event) => {
        const insertButton = event.target.closest('[data-insert]');
        if (insertButton?.dataset.insert === 'emoji') {
            event.preventDefault();
            insertTextAtEditor(' 😊 ');
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeCommentMenu();
        }
    });

    function openModal(modal) {
        if (!modal) {
            return;
        }
        modal.hidden = false;
        modalOverlay.hidden = false;
        document.body.classList.add('sunday-modal-open');
        const focusable = modal.querySelector('input:not([disabled]), textarea:not([disabled]), select:not([disabled])');
        if (focusable) {
            setTimeout(() => focusable.focus(), 30);
        }
    }

    function closeModal(modal) {
        if (!modal || modal.hidden) {
            return;
        }
        modal.hidden = true;
        if (modalOverlay) {
            modalOverlay.hidden = true;
        }
        document.body.classList.remove('sunday-modal-open');
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }

    function updateBoardCache(board) {
        const index = boardsCache.findIndex((item) => item.id === board.id);
        if (index >= 0) {
            boardsCache[index] = board;
        } else {
            boardsCache.push(board);
        }
    }

    function removeBoardFromCache(boardId) {
        boardsCache = boardsCache.filter((board) => board.id !== boardId);
    }

    function getBoardFromCache(boardId) {
        return boardsCache.find((board) => board.id === boardId) || null;
    }

    function ensureSharedScrollbar() {
        if (sharedScrollbar) {
            return;
        }
        sharedScrollbar = document.createElement('div');
        sharedScrollbar.className = 'sunday-scrollbar';
        sharedScrollbarInner = document.createElement('div');
        sharedScrollbarInner.className = 'sunday-scrollbar__inner';
        sharedScrollbarInner.style.width = '0px';
        sharedScrollbar.appendChild(sharedScrollbarInner);
        sharedScrollbar.addEventListener('scroll', handleSharedScrollbarScroll, { passive: true });
        const host = document.body || wrapper;
        host.appendChild(sharedScrollbar);
    }

    function cleanupTableScrollers() {
        tableScrollCleanups.forEach((cleanup) => cleanup());
        tableScrollCleanups = [];
        sharedActiveTable = null;
        sharedActiveViewport = null;
        sharedSyncingFromTable = false;
        sharedSyncingFromBar = false;
        registeredTables.clear();
        if (sharedScrollbar) {
            sharedScrollbar.classList.remove('is-active');
            sharedScrollbar.scrollLeft = 0;
        }
        if (sharedScrollbarInner) {
            sharedScrollbarInner.style.width = '0px';
        }
    }

    function setActiveScrollTable(tableEl, viewportEl) {
        sharedActiveTable = tableEl || null;
        sharedActiveViewport = viewportEl || null;
        updateSharedScrollbarMetrics();
    }

    function updateSharedScrollbarMetrics() {
        if (!sharedScrollbar || !sharedActiveTable || !sharedActiveViewport) {
            if (sharedScrollbar) {
                sharedScrollbar.classList.remove('is-active');
            }
            return;
        }
        const totalWidth = sharedActiveViewport.scrollWidth;
        sharedScrollbarInner.style.width = `${totalWidth}px`;
        const needsScroll = totalWidth > sharedActiveTable.clientWidth + 2;
        sharedScrollbar.classList.toggle('is-active', needsScroll);
        if (needsScroll) {
            sharedSyncingFromTable = true;
            sharedScrollbar.scrollLeft = sharedActiveTable.scrollLeft;
            requestAnimationFrame(() => {
                sharedSyncingFromTable = false;
            });
        } else {
            sharedScrollbar.scrollLeft = 0;
        }
    }

    function syncAllTablesScroll(left, except = null) {
        registeredTables.forEach((table) => {
            if (table === except) {
                return;
            }
            if (Math.abs(table.scrollLeft - left) > 0.5) {
                table.scrollLeft = left;
            }
        });
    }

    function syncSharedFromTable() {
        if (!sharedScrollbar || !sharedActiveTable || sharedSyncingFromBar) {
            return;
        }
        sharedSyncingFromTable = true;
        sharedScrollbar.scrollLeft = sharedActiveTable.scrollLeft;
        syncAllTablesScroll(sharedScrollbar.scrollLeft, sharedActiveTable);
        requestAnimationFrame(() => {
            sharedSyncingFromTable = false;
        });
    }

    function handleSharedScrollbarScroll() {
        if (!sharedActiveTable || sharedSyncingFromTable) {
            return;
        }
        sharedSyncingFromBar = true;
        syncAllTablesScroll(sharedScrollbar.scrollLeft);
        requestAnimationFrame(() => {
            sharedSyncingFromBar = false;
        });
    }

    function registerSharedScrollbar(tableEl, viewportEl) {
        ensureSharedScrollbar();
        registeredTables.add(tableEl);

        const updateIfActive = () => {
            if (sharedActiveTable === tableEl) {
                updateSharedScrollbarMetrics();
            }
        };

        const resizeObserver = new ResizeObserver(updateIfActive);
        resizeObserver.observe(viewportEl);
        resizeObserver.observe(tableEl);

        const onTableScroll = () => {
            if (sharedActiveTable !== tableEl) {
                setActiveScrollTable(tableEl, viewportEl);
            }
            if (sharedActiveTable === tableEl) {
                syncSharedFromTable();
            }
        };

        const onPointerEnter = () => setActiveScrollTable(tableEl, viewportEl);
        const onFocusIn = () => setActiveScrollTable(tableEl, viewportEl);

        tableEl.addEventListener('scroll', onTableScroll, { passive: true });
        tableEl.addEventListener('pointerenter', onPointerEnter);
        tableEl.addEventListener('focusin', onFocusIn);

        tableScrollCleanups.push(() => {
            resizeObserver.disconnect();
            tableEl.removeEventListener('scroll', onTableScroll);
            tableEl.removeEventListener('pointerenter', onPointerEnter);
            tableEl.removeEventListener('focusin', onFocusIn);
            registeredTables.delete(tableEl);
        });

        requestAnimationFrame(() => {
            const style = window.getComputedStyle(tableEl);
            const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
            if (!sharedActiveTable && isVisible) {
                setActiveScrollTable(tableEl, viewportEl);
            } else if (sharedActiveTable === tableEl) {
                updateSharedScrollbarMetrics();
            } else {
                updateIfActive();
            }
        });
    }

    function setCurrentBoard(board) {
        const nextBoardId = board?.id ?? null;
        const currentBoardId = currentBoard?.id ?? null;
        const isDifferentBoard = nextBoardId !== currentBoardId;
        if (isDifferentBoard) {
            closeObservationSidebar();
            selectedRows.clear();
        }
        closeBoardMenu();
        closeColumnMenu();
        closeLabelPicker();
        closeInlineEditor();

        currentBoard = board;
        activeBoardId = nextBoardId;
        columnWidthState.clear();
        currentOrderedColumns = [];
        currentGridTemplate = '';
        observationColumns = [];
        reorderableColumns = [];
        if (board) {
            updateBoardCache(board);
        }

        renderBoardSidebar();

        if (board) {
            renderBoard(board);
            refreshObservationSidebar();
        } else {
            recentlyAddedItemId = null;
            recentlyAddedGroupId = null;
            recentlyAddedColumnId = null;
            renderNoBoards();
        }
    }

    function getColumnById(board, columnId) {
        return board?.columns?.find((column) => column.id === columnId) || null;
    }

    function getItemById(board, itemId) {
        for (const group of board?.groups || []) {
            const match = group.items?.find((item) => item.id === itemId);
            if (match) {
                return { item: match, group };
            }
        }
        return null;
    }

    function getCellById(board, cellId) {
        for (const group of board?.groups || []) {
            for (const item of group.items || []) {
                const cell = item.cells?.find((c) => c.id === cellId);
                if (cell) {
                    return { cell, item, group };
                }
            }
        }
        return null;
    }

    function getLabelOptions(column) {
        const config = column?.config;
        if (!config || !Array.isArray(config.labels)) {
            return [];
        }
        return config.labels;
    }

    function findLabel(column, labelId) {
        return getLabelOptions(column).find((label) => label.id === labelId) || null;
    }

    async function loadBoards() {
        try {
            const boards = await fetchJSON(boardsEndpoint);
            boardsCache = boards;
            if (!boards.length) {
                setCurrentBoard(null);
                return;
            }
            const targetBoardId = activeBoardId || boards[0].id;
            await loadBoardDetail(targetBoardId);
        } catch (error) {
            console.error(error);
            showToast('Não foi possível carregar seus quadros.');
            setCurrentBoard(null);
        }
    }

    async function loadBoardDetail(boardId) {
        try {
            const board = await fetchJSON(`${boardsEndpoint}/${boardId}`);
            setCurrentBoard(board);
            return board;
        } catch (error) {
            console.error(error);
            showToast('Erro ao carregar detalhes do quadro.');
            return null;
        }
    }

    function renderBoardSidebar() {
        boardSidebarList.innerHTML = '';

        if (!boardsCache.length) {
            const empty = document.createElement('li');
            empty.className = 'sidebar-empty';
            empty.textContent = 'Nenhum quadro criado.';
            boardSidebarList.appendChild(empty);
            return;
        }

        boardsCache.forEach((board) => {
            const totalItems = board.groups?.reduce((acc, group) => acc + (group.items?.length || 0), 0) || 0;
            const groupCount = board.groups?.length || 0;
            const li = document.createElement('li');
            li.dataset.boardId = board.id;
            li.innerHTML = `<strong>${ICON_BOARD}${board.name}</strong><span>${ICON_TABLE}${groupCount} ${groupCount === 1 ? 'tabela' : 'tabelas'} · ${ICON_ITEM}${totalItems} ${totalItems === 1 ? 'item' : 'itens'}</span>`;
            if (board.id === activeBoardId) {
                li.classList.add('is-active');
            }
            boardSidebarList.appendChild(li);
        });
    }

    function renderNoBoards() {
        activeBoardId = null;
        currentBoard = null;
        boardTitleEl.textContent = 'STG Sunday';
        boardTitleEl.classList.add('is-editable');
        boardTitleEl.dataset.action = 'rename-board';
        boardTitleEl.setAttribute('title', 'Clique para editar o nome do quadro');
        boardSubtitleEl.textContent = 'Crie um novo quadro para começar a organização da semana.';
        summaryGroupsEl.textContent = '0 tabelas';
        summaryItemsEl.textContent = '0 itens';
        boardListEl.innerHTML = '';
        cleanupTableScrollers();
        const empty = document.createElement('div');
        empty.className = 'sunday-board-empty';
        empty.innerHTML = `
            <p>Nenhum quadro cadastrado. Clique em “Novo quadro” para iniciar.</p>
            <button class="sunday-btn sunday-btn-primary" data-action="create-board">Criar quadro</button>
        `;
        boardListEl.appendChild(empty);
    }

    function renderBoard(board) {
        boardTitleEl.textContent = board.name;
        boardTitleEl.classList.add('is-editable');
        boardTitleEl.dataset.action = 'rename-board';
        boardTitleEl.setAttribute('title', 'Clique para editar o nome do quadro');
        boardSubtitleEl.textContent = board.description || 'Quadro sem descrição.';

        const groups = [...(board.groups || [])].sort((a, b) => a.position - b.position);
        const columns = [...(board.columns || [])].sort((a, b) => a.position - b.position);
        refreshColumnOrdering(columns);
        const orderedColumns = currentOrderedColumns;

        const groupIdSet = new Set(groups.map((g) => g.id));
        Array.from(selectedRows.keys()).forEach((id) => {
            if (!groupIdSet.has(id)) {
                selectedRows.delete(id);
            }
        });

        const totalGroups = groups.length;
        const totalItems = groups.reduce((acc, group) => acc + (group.items?.length || 0), 0);
        summaryGroupsEl.textContent = `${totalGroups} ${totalGroups === 1 ? 'tabela' : 'tabelas'}`;
        summaryItemsEl.textContent = `${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`;

        boardListEl.innerHTML = '';
        cleanupTableScrollers();

        if (!totalGroups) {
            const empty = document.createElement('div');
            empty.className = 'sunday-board-empty sunday-board-create-cta';
            empty.innerHTML = `
                <div>
                    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><polyline points="3 12 5 12 21 12"></polyline><polyline points="3 18 5 18 21 18"></polyline></svg>
                </div>
                <p>Nenhuma tabela neste quadro ainda.</p>
                <button class="sunday-btn sunday-btn-primary" data-action="create-group">Criar primeira tabela</button>
            `;
            boardListEl.appendChild(empty);
            return;
        }

        groups.forEach((group) => {
            const groupEl = buildGroupElement(board, group, orderedColumns);
            boardListEl.appendChild(groupEl);

            if (group.id === recentlyAddedGroupId) {
                groupEl.classList.add('is-recent');
                setTimeout(() => groupEl.classList.remove('is-recent'), 1600);
                setTimeout(() => groupEl.scrollIntoView({ behavior: 'smooth', block: 'center' }), 240);
            }

            updateGroupSelectionUI(group.id);

            if (recentlyAddedItemId) {
                const newRow = groupEl.querySelector(`.sunday-table__row[data-item-id="${recentlyAddedItemId}"]`);
                if (newRow) {
                    newRow.classList.add('is-recent');
                    setTimeout(() => newRow.classList.remove('is-recent'), 1600);
                    setTimeout(() => newRow.scrollIntoView({ behavior: 'smooth', block: 'center' }), 260);
                }
            }
        });

        applyColumnLayout();

        if (recentlyAddedColumnId) {
            const headerEl = boardListEl.querySelector(`.sunday-column-header[data-column-id="${recentlyAddedColumnId}"]`);
            if (headerEl) {
                headerEl.classList.add('is-recent');
                setTimeout(() => headerEl.classList.remove('is-recent'), 1600);
                setTimeout(() => headerEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }), 220);
            }
        }

        recentlyAddedItemId = null;
        recentlyAddedGroupId = null;
        recentlyAddedColumnId = null;
    }

    function clampColumnWidth(width) {
        if (!Number.isFinite(width)) {
            return COLUMN_DEFAULT_WIDTH;
        }
        const rounded = Math.round(width);
        return Math.min(COLUMN_MAX_WIDTH, Math.max(COLUMN_MIN_WIDTH, rounded));
    }

    function hydrateColumnWidthState(columns) {
        const validIds = new Set();
        columns.forEach((column) => {
            validIds.add(column.id);
            const widthFromConfig = Number(column?.config?.width);
            if (Number.isFinite(widthFromConfig)) {
                columnWidthState.set(column.id, clampColumnWidth(widthFromConfig));
            } else if (!columnWidthState.has(column.id)) {
                columnWidthState.set(column.id, COLUMN_DEFAULT_WIDTH);
            }
        });
        Array.from(columnWidthState.keys()).forEach((columnId) => {
            if (!validIds.has(columnId)) {
                columnWidthState.delete(columnId);
            }
        });
    }

    function getColumnWidth(columnId) {
        if (columnWidthState.has(columnId)) {
            return columnWidthState.get(columnId);
        }
        const column = getColumnById(currentBoard, columnId);
        const widthFromConfig = Number(column?.config?.width);
        const width = Number.isFinite(widthFromConfig) ? clampColumnWidth(widthFromConfig) : COLUMN_DEFAULT_WIDTH;
        columnWidthState.set(columnId, width);
        return width;
    }

    function getOrderedColumns(columns) {
        const obs = columns.filter((c) => c.column_type === 'observation');
        const rest = columns.filter((c) => c.column_type !== 'observation');
        return obs.concat(rest);
    }

    function buildGridTemplate(columns) {
        const parts = ['var(--sunday-checkbox-col-width, 46px)', 'var(--sunday-item-col-width, 240px)'];
        columns.forEach((column) => {
            const width = getColumnWidth(column.id);
            parts.push(`minmax(${COLUMN_MIN_WIDTH}px, ${width}px)`);
        });
        parts.push('64px');
        return parts.join(' ');
    }

    function refreshColumnOrdering(columns) {
        const ordered = getOrderedColumns(columns);
        observationColumns = ordered.filter((column) => column.column_type === 'observation');
        reorderableColumns = ordered.filter((column) => column.column_type !== 'observation');
        hydrateColumnWidthState(ordered);
        currentOrderedColumns = ordered;
        currentGridTemplate = buildGridTemplate(ordered);
        return ordered;
    }

    function applyColumnLayout() {
        if (!currentOrderedColumns.length) {
            return;
        }
        currentGridTemplate = buildGridTemplate(currentOrderedColumns);
        const heads = boardListEl.querySelectorAll('.sunday-table__head');
        heads.forEach((head) => {
            head.style.gridTemplateColumns = currentGridTemplate;
        });
        const rows = boardListEl.querySelectorAll('.sunday-table__row');
        rows.forEach((row) => {
            row.style.gridTemplateColumns = currentGridTemplate;
        });
        updateSharedScrollbarMetrics();
    }

    function buildGroupElement(board, group, orderedColumns) {
        const groupEl = document.createElement('article');
        groupEl.className = 'sunday-group';
        groupEl.dataset.groupId = group.id;
        const accentColor = group.color_hex || '#4361EE';
        groupEl.style.setProperty('--sunday-group-accent', accentColor);
        const selectionSet = ensureSelectionSet(group.id);

        const gridTemplate = currentGridTemplate || buildGridTemplate(orderedColumns);

        const header = document.createElement('header');
        header.className = 'sunday-group__header';

        const title = document.createElement('div');
        title.className = 'sunday-group__title';
        const titleButton = document.createElement('button');
        titleButton.type = 'button';
        titleButton.className = 'sunday-group__title-button';
        titleButton.dataset.action = 'rename-group';
        titleButton.dataset.groupId = group.id;
        titleButton.title = 'Renomear tabela';
        const titleMain = document.createElement('strong');
        if (group.name) {
            titleMain.textContent = group.name;
            titleMain.style.color = accentColor;
        } else {
            titleMain.textContent = 'Clique para nomear';
            titleMain.classList.add('is-placeholder');
        }
        titleMain.dataset.action = 'rename-group';
        titleMain.dataset.groupId = group.id;
        titleButton.appendChild(titleMain);
        const subtitle = document.createElement('small');
        const itemCount = group.items?.length || 0;
        subtitle.textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`;
        title.append(titleButton, subtitle);

        const actions = document.createElement('div');
        actions.className = 'sunday-group__actions';

        const collapseBtn = document.createElement('button');
        collapseBtn.type = 'button';
        collapseBtn.dataset.action = 'toggle-group';
        collapseBtn.title = group.is_collapsed ? 'Expandir tabela' : 'Recolher tabela';
        collapseBtn.innerHTML = group.is_collapsed
            ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>'
            : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
        actions.appendChild(collapseBtn);

        const deleteSelectedBtn = document.createElement('button');
        deleteSelectedBtn.type = 'button';
        deleteSelectedBtn.dataset.action = 'delete-selected';
        deleteSelectedBtn.dataset.groupId = group.id;
        deleteSelectedBtn.title = 'Excluir linhas selecionadas';
        deleteSelectedBtn.className = 'sunday-group__delete-selected';
        deleteSelectedBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
        deleteSelectedBtn.hidden = true;
        deleteSelectedBtn.disabled = true;
        actions.appendChild(deleteSelectedBtn);

        const groupMenuBtn = document.createElement('button');
        groupMenuBtn.type = 'button';
        groupMenuBtn.dataset.action = 'group-menu';
        groupMenuBtn.dataset.groupId = group.id;
        groupMenuBtn.title = 'Opções da tabela';
        groupMenuBtn.innerHTML = ICON_MORE;
        actions.appendChild(groupMenuBtn);

        header.append(title, actions);

        const table = document.createElement('div');
        table.className = 'sunday-table';
        if (group.is_collapsed) {
            table.style.display = 'none';
        }

        const viewport = document.createElement('div');
        viewport.className = 'sunday-table__viewport';

        const head = document.createElement('div');
        head.className = 'sunday-table__head';
        head.style.gridTemplateColumns = gridTemplate;

        const checkboxHeader = document.createElement('span');
        checkboxHeader.className = 'sunday-table__head-checkbox';
        head.appendChild(checkboxHeader);

        const titleHeader = document.createElement('span');
        titleHeader.textContent = 'Item';
        head.appendChild(titleHeader);

        orderedColumns.forEach((column) => {
            const span = document.createElement('span');
            span.className = 'sunday-table__head-cell';
            span.dataset.columnId = column.id;

            const headerWrapper = document.createElement('div');
            headerWrapper.className = 'sunday-column-header';
            headerWrapper.dataset.columnId = column.id;
            headerWrapper.dataset.columnType = column.column_type;

            const titleBtn = document.createElement('button');
            titleBtn.type = 'button';
            titleBtn.className = 'sunday-column-header__title';
            if (column.column_type !== 'observation') {
                titleBtn.dataset.action = 'rename-column';
            }
            titleBtn.dataset.columnId = column.id;

            const titleSpan = document.createElement('span');
            titleSpan.className = 'sunday-column-title';
            if (column.column_type === 'observation') {
                titleSpan.textContent = 'Observação';
            } else if (column.name) {
                titleSpan.textContent = column.name;
            } else {
                titleSpan.textContent = 'Clique para nomear';
                titleSpan.classList.add('is-placeholder');
            }

            titleBtn.appendChild(titleSpan);

            const headerActions = document.createElement('div');
            headerActions.className = 'sunday-column-header__actions';
            if (column.column_type !== 'observation') {
                const menuBtn = document.createElement('button');
                menuBtn.type = 'button';
                menuBtn.dataset.action = 'column-menu';
                menuBtn.dataset.columnId = column.id;
                menuBtn.title = 'Opções da coluna';
                menuBtn.innerHTML = ICON_MORE;
                headerActions.appendChild(menuBtn);
            }

            let dragHandle = null;
            if (column.column_type !== 'observation') {
                headerWrapper.classList.add('is-reorderable');
                dragHandle = headerWrapper; // usar toda a área do header como handle
            }

            headerWrapper.appendChild(titleBtn);
            // Não adicionar botão de handle; a área inteira do header é o handle
            headerWrapper.appendChild(headerActions);
            span.appendChild(headerWrapper);

            const resizer = document.createElement('button');
            resizer.type = 'button';
            resizer.className = 'sunday-column-resizer';
            resizer.dataset.columnId = column.id;
            resizer.setAttribute('aria-label', 'Ajustar largura da coluna');
            resizer.tabIndex = 0;
            resizer.innerHTML = ICON_RESIZE;
            span.appendChild(resizer);

            head.appendChild(span);

            setupColumnResize(resizer, column.id);
            setupColumnDrag(headerWrapper, dragHandle, column);
        });

        const addColumnHeader = document.createElement('span');
        addColumnHeader.className = 'sunday-column-add';
        const addColumnBtn = document.createElement('button');
        addColumnBtn.type = 'button';
        addColumnBtn.dataset.action = 'add-column';
        addColumnBtn.dataset.boardId = board.id;
        addColumnBtn.title = 'Adicionar nova coluna';
        addColumnBtn.setAttribute('aria-label', 'Adicionar nova coluna');
        addColumnBtn.textContent = '+';
        addColumnHeader.appendChild(addColumnBtn);
        head.appendChild(addColumnHeader);

        const body = document.createElement('div');
        body.className = 'sunday-table__body';
        let ghostColumnShortcutAdded = false;

        const createColumnShortcutButton = () => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.action = 'add-column';
            btn.dataset.boardId = board.id;
            btn.title = 'Adicionar nova coluna';
            btn.setAttribute('aria-label', 'Adicionar nova coluna');
            btn.textContent = '+';
            return btn;
        };

        (group.items || [])
            .slice()
            .sort((a, b) => a.position - b.position)
            .forEach((item) => {
                const row = document.createElement('div');
                row.className = 'sunday-table__row';
                row.dataset.itemId = item.id;
                row.dataset.groupId = group.id;
                row.style.gridTemplateColumns = gridTemplate;

                const checkboxCell = document.createElement('div');
                checkboxCell.className = 'sunday-cell sunday-cell--checkbox';
                const rowHandle = document.createElement('button');
                rowHandle.type = 'button';
                rowHandle.className = 'sunday-row-handle';
                rowHandle.tabIndex = -1;
                rowHandle.setAttribute('aria-label', item.title ? `Reordenar linha ${item.title}` : 'Reordenar linha');
                rowHandle.innerHTML = '';
                rowHandle.addEventListener('click', (event) => event.preventDefault());
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.setAttribute('data-select-row', 'true');
                checkbox.dataset.groupId = group.id;
                checkbox.dataset.itemId = item.id;
                checkbox.setAttribute('aria-label', 'Selecionar linha');
                checkboxCell.append(rowHandle, checkbox);
                row.appendChild(checkboxCell);
                setupRowDrag(rowHandle, row, item.id, group.id);

                const firstCell = document.createElement('div');
                firstCell.className = 'sunday-cell sunday-cell--item is-clickable';
                firstCell.dataset.action = 'rename-item';
                firstCell.dataset.itemId = item.id;
                firstCell.tabIndex = 0;
                if (item.title) {
                    firstCell.textContent = item.title;
                    firstCell.title = item.title;
                } else {
                    firstCell.classList.add('is-empty');
                    firstCell.innerHTML = '<span class="sunday-cell-placeholder">Clique para nomear</span>';
                }
                row.appendChild(firstCell);

                if (selectionSet.has(item.id)) {
                    row.classList.add('is-selected');
                    checkbox.checked = true;
                }

                orderedColumns.forEach((column) => {
                    const cell = document.createElement('div');
                    cell.className = 'sunday-cell';
                    cell.dataset.cellType = column.column_type;
                    cell.dataset.columnId = column.id;
                    cell.dataset.groupId = group.id;
                    cell.dataset.itemId = item.id;

                    const cellData = (item.cells || []).find((c) => c.column_id === column.id);
                    if (!cellData) {
                        if (column.column_type !== 'observation') {
                            cell.classList.add('is-clickable', 'is-empty');
                            cell.tabIndex = 0;
                            cell.textContent = '';
                        } else {
                            cell.classList.add('sunday-cell--observation');
                        }
                        row.appendChild(cell);
                        return;
                    }

                    cell.dataset.cellId = cellData.id;
                    cell.dataset.value = cellData.raw_value || '';

                    if (column.column_type === 'observation') {
                        cell.classList.add('sunday-cell--observation');
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'sunday-observation-button';
                        btn.dataset.action = 'open-observation';
                        btn.dataset.cellId = cellData.id;
                        btn.dataset.itemId = item.id;
                        btn.dataset.columnId = column.id;
                        btn.dataset.groupId = group.id;
                        const count = cellData.comments?.length || 0;
                        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11.5" cy="11.5" r="7.5"></circle><path d="M6.5 18.5L5 22L8.6 20.8Z"></path><circle cx="9.5" cy="11.5" r="0.6"></circle><circle cx="11.5" cy="11.5" r="0.6"></circle><circle cx="13.5" cy="11.5" r="0.6"></circle></svg><span>${count}</span>`;
                        cell.appendChild(btn);
                    } else if (column.column_type === 'status' || column.column_type === 'label') {
                        cell.classList.add('is-clickable', 'sunday-cell--status');
                        cell.tabIndex = 0;
                        cell.classList.remove('is-empty');
                        const labelOption = findLabel(column, cellData.raw_value || '');
                        cell.innerHTML = '';
                        cell.style.background = '';
                        cell.style.color = '';
                        cell.dataset.labelColor = '';
                        cell.classList.toggle('has-status-label', Boolean(labelOption));
                        if (labelOption) {
                            const colorHex = labelOption.color || '#4361EE';
                            cell.textContent = labelOption.text;
                            cell.title = labelOption.text;
                            cell.dataset.labelColor = colorHex;
                            cell.style.background = colorHex;
                        } else if (cellData.raw_value) {
                            cell.textContent = cellData.raw_value;
                            cell.title = cellData.raw_value;
                            const fallbackColor = cellData.color_hex || '#4361EE';
                            cell.dataset.labelColor = fallbackColor;
                            cell.style.background = fallbackColor;
                            cell.classList.add('has-status-label');
                        } else {
                            cell.classList.add('is-empty');
                            cell.innerHTML = '<span class="sunday-cell-placeholder">Selecionar status</span>';
                            cell.classList.remove('has-status-label');
                        }
                    } else {
                        cell.classList.add('is-clickable');
                        cell.tabIndex = 0;
                        if (column.column_type === 'date') {
                            cell.classList.add('sunday-cell--date');
                        }
                        if (cellData.color_hex) {
                            cell.style.background = cellData.color_hex;
                            cell.style.color = '#0f172a';
                        }
                        const value = formatCellValue(column.column_type, cellData.raw_value);
                        if (value) {
                            cell.textContent = value;
                            cell.title = value;
                        } else {
                            cell.classList.add('is-empty');
                            cell.textContent = '';
                        }
                    }

                    row.appendChild(cell);
                });

                const ghostCell = document.createElement('div');
                ghostCell.className = 'sunday-cell sunday-cell--ghost';
                ghostCell.setAttribute('aria-hidden', 'true');
                if (!ghostColumnShortcutAdded) {
                    ghostCell.appendChild(createColumnShortcutButton());
                    ghostColumnShortcutAdded = true;
                }
                row.appendChild(ghostCell);

                body.appendChild(row);
            });

        if (!ghostColumnShortcutAdded) {
            const shortcutRow = document.createElement('div');
            shortcutRow.className = 'sunday-table__row sunday-table__row--shortcut';
            shortcutRow.style.gridTemplateColumns = gridTemplate;
            shortcutRow.setAttribute('aria-hidden', 'true');
            const checkboxFiller = document.createElement('div');
            checkboxFiller.className = 'sunday-cell sunday-cell--checkbox';
            checkboxFiller.setAttribute('aria-hidden', 'true');
            shortcutRow.appendChild(checkboxFiller);
            const leadingCell = document.createElement('div');
            leadingCell.className = 'sunday-cell sunday-cell--item';
            leadingCell.setAttribute('aria-hidden', 'true');
            shortcutRow.appendChild(leadingCell);

            orderedColumns.forEach(() => {
                const filler = document.createElement('div');
                filler.className = 'sunday-cell';
                filler.setAttribute('aria-hidden', 'true');
                shortcutRow.appendChild(filler);
            });

            const ghostCell = document.createElement('div');
            ghostCell.className = 'sunday-cell sunday-cell--ghost';
            ghostCell.setAttribute('aria-hidden', 'true');
            ghostCell.appendChild(createColumnShortcutButton());
            shortcutRow.appendChild(ghostCell);

            body.appendChild(shortcutRow);
        }

        viewport.append(head, body);
        table.appendChild(viewport);

        registerSharedScrollbar(table, viewport);

        const footer = document.createElement('div');
        footer.className = 'sunday-table__footer';
        footer.innerHTML = `
            <button type="button" data-action="add-item" data-group-id="${group.id}">+ Nova linha</button>
            <button type="button" data-action="add-column" data-board-id="${board.id}">+ Nova coluna</button>
        `;

        groupEl.append(header, table, footer);
        const validItemIds = new Set((group.items || []).map((item) => item.id));
        Array.from(selectionSet)
            .filter((itemId) => !validItemIds.has(itemId))
            .forEach((itemId) => selectionSet.delete(itemId));
        return groupEl;
    }

    function setupColumnResize(resizer, columnId) {
        if (!resizer) {
            return;
        }
        resizer.addEventListener('pointerdown', (event) => {
            startColumnResize(event, columnId, resizer);
        });
    }

    function startColumnResize(event, columnId, resizer) {
        if (activeColumnResize) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const startWidth = getColumnWidth(columnId);
        activeColumnResize = {
            columnId,
            pointerId: event.pointerId,
            startX: event.clientX,
            startWidth,
            previousWidth: startWidth,
            resizer,
        };
        if (typeof resizer.setPointerCapture === 'function') {
            try {
                resizer.setPointerCapture(event.pointerId);
            } catch (error) {
                // ignore capture errors
            }
        }
        document.body.classList.add('sunday-column-resizing');
        window.addEventListener('pointermove', handleColumnResizeMove);
        window.addEventListener('pointerup', handleColumnResizeEnd);
        window.addEventListener('pointercancel', handleColumnResizeEnd);
    }

    function handleColumnResizeMove(event) {
        if (!activeColumnResize || event.pointerId !== activeColumnResize.pointerId) {
            return;
        }
        const delta = event.clientX - activeColumnResize.startX;
        const width = clampColumnWidth(activeColumnResize.startWidth + delta);
        if (columnWidthState.get(activeColumnResize.columnId) === width) {
            return;
        }
        columnWidthState.set(activeColumnResize.columnId, width);
        const column = getColumnById(currentBoard, activeColumnResize.columnId);
        if (column) {
            if (!column.config) {
                column.config = {};
            }
            column.config.width = width;
        }
        applyColumnLayout();
    }

    async function handleColumnResizeEnd(event) {
        if (!activeColumnResize || ('pointerId' in event && event.pointerId !== activeColumnResize.pointerId)) {
            return;
        }
        const state = activeColumnResize;
        activeColumnResize = null;
        window.removeEventListener('pointermove', handleColumnResizeMove);
        window.removeEventListener('pointerup', handleColumnResizeEnd);
        window.removeEventListener('pointercancel', handleColumnResizeEnd);
        document.body.classList.remove('sunday-column-resizing');
        if (state.resizer && typeof state.resizer.releasePointerCapture === 'function') {
            try {
                state.resizer.releasePointerCapture(state.pointerId);
            } catch (error) {
                // ignore release errors
            }
        }

        const width = columnWidthState.get(state.columnId) ?? state.previousWidth;
        if (width === state.previousWidth) {
            return;
        }

        try {
            await persistColumnWidth(state.columnId, width);
        } catch (error) {
            columnWidthState.set(state.columnId, state.previousWidth);
            const column = getColumnById(currentBoard, state.columnId);
            if (column) {
                if (!column.config) {
                    column.config = {};
                }
                column.config.width = state.previousWidth;
            }
            applyColumnLayout();
            console.error(error);
            showToast('Não foi possível salvar a largura da coluna.');
        }
    }

    async function persistColumnWidth(columnId, width) {
        if (!currentBoard) {
            return;
        }
        const column = getColumnById(currentBoard, columnId);
        if (!column) {
            return;
        }
        const mergedConfig = { ...(column.config || {}) };
        mergedConfig.width = width;
        const board = await fetchJSON(`${boardsEndpoint.replace('/boards', '/columns')}/${columnId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: mergedConfig }),
        });
        column.config = mergedConfig;
        columnWidthState.set(columnId, width);
        if (board && currentBoard && board.id === currentBoard.id) {
            Object.assign(currentBoard, board);
            updateBoardCache(currentBoard);
        } else if (board) {
            updateBoardCache(board);
        } else if (currentBoard) {
            updateBoardCache(currentBoard);
        }
        const latestColumnsSource = board?.id === currentBoard?.id ? board.columns : currentBoard?.columns;
        const latestColumns = [...(latestColumnsSource || [])].sort((a, b) => a.position - b.position);
        refreshColumnOrdering(latestColumns);
        applyColumnLayout();
    }

    function setupColumnDrag(headerWrapper, grip, column) {
        if (!headerWrapper || !grip) {
            if (headerWrapper) {
                headerWrapper.draggable = false;
            }
            return;
        }
        // Preferir DnD via Pointer API para suavidade e controle total
        headerWrapper.draggable = false;
        grip.addEventListener('pointerdown', (event) => {
            // Não iniciar drag se o alvo for um elemento interativo (menu, título, botões etc.)
            const interactive = event.target.closest('.sunday-column-header__actions, .sunday-column-header__title, button, a, input, textarea, [data-action]');
            if (interactive) return;
            beginColumnPointerDrag(event, headerWrapper, grip, column.id);
        });
        grip.addEventListener('pointerup', () => finishColumnPointerPrep(headerWrapper, grip));
        grip.addEventListener('pointercancel', () => finishColumnPointerPrep(headerWrapper, grip));
    }
    
    function finishColumnPointerPrep(headerWrapper, grip) {
        if (!columnDragState || columnDragState.dragging) {
            return;
        }
        headerWrapper.classList.remove('is-drag-ready');
        headerWrapper.removeAttribute('data-drag-ready');
        grip?.classList.remove('is-grabbing');
        // Remover destaque da coluna caso tenha sido aplicado antecipadamente
        if (headerWrapper?.dataset?.columnId) {
            setColumnHighlight(Number(headerWrapper.dataset.columnId), false);
        }
        if (grip && typeof grip.releasePointerCapture === 'function') {
            const pointerId = columnDragState?.pointerId;
            if (pointerId) {
                try {
                    grip.releasePointerCapture(pointerId);
                } catch (error) {
                    // ignore release errors
                }
            }
        }
        columnDragState = null;
    }
    
    function beginColumnPointerDrag(event, headerWrapper, grip, columnId) {
        event.preventDefault();
        event.stopPropagation();
        columnDragState = {
            columnId,
            sourceWrapper: headerWrapper,
            grip,
            pointerId: event.pointerId,
            dragging: true,
            dropTarget: null,
        };
        document.body.classList.add('sunday-column-dragging');
        grip.classList.add('is-grabbing');
        headerWrapper.classList.add('is-dragging');
        setColumnHighlight(columnId, true);
        if (typeof grip.setPointerCapture === 'function') {
            try { grip.setPointerCapture(event.pointerId); } catch {}
        }
        // avatar visual
        const title = headerWrapper.querySelector('.sunday-column-title')?.textContent || 'Coluna';
        columnDragAvatar = document.createElement('div');
        columnDragAvatar.className = 'sunday-column-drag-avatar';
        columnDragAvatar.innerHTML = `${title}`;
        document.body.appendChild(columnDragAvatar);
        moveColumnDragAvatar(event.clientX, event.clientY);
        window.addEventListener('pointermove', onColumnPointerDragMove);
        window.addEventListener('pointerup', onColumnPointerDragEnd, { once: true });
        window.addEventListener('pointercancel', onColumnPointerDragEnd, { once: true });
    }

    function moveColumnDragAvatar(x, y) {
        if (!columnDragAvatar) return;
        columnDragAvatar.style.transform = `translate(${Math.round(x + 10)}px, ${Math.round(y + 10)}px)`;
    }

    function findHeaderTargetAt(x, y) {
        const el = document.elementFromPoint(x, y);
        const wrapper = el?.closest?.('.sunday-column-header');
        if (!wrapper) return null;
        const targetId = Number(wrapper.dataset.columnId);
        if (!targetId || targetId === columnDragState.columnId) return null;
        // Só permitir reordenar entre colunas não-observation
        const isReorderable = wrapper.dataset.columnType !== 'observation';
        if (!isReorderable) return null;
        const rect = wrapper.getBoundingClientRect();
        const isAfter = x - rect.left > rect.width / 2;
        return { wrapper, targetId, isAfter };
    }

    function onColumnPointerDragMove(event) {
        if (!columnDragState?.dragging) return;
        moveColumnDragAvatar(event.clientX, event.clientY);
        const target = findHeaderTargetAt(event.clientX, event.clientY);
        if (!target) {
            if (columnDragState.dropTarget) {
                columnDragState.dropTarget.wrapper.classList.remove('is-drop-before', 'is-drop-after');
                columnDragState.dropTarget = null;
            }
            return;
        }
        const { wrapper, isAfter } = target;
        if (columnDragState.dropTarget && columnDragState.dropTarget.wrapper !== wrapper) {
            columnDragState.dropTarget.wrapper.classList.remove('is-drop-before', 'is-drop-after');
        }
        wrapper.classList.toggle('is-drop-after', isAfter);
        wrapper.classList.toggle('is-drop-before', !isAfter);
        columnDragState.dropTarget = target;
    }

    async function onColumnPointerDragEnd(event) {
        const state = columnDragState;
        columnDragState = null;
        window.removeEventListener('pointermove', onColumnPointerDragMove);
        document.body.classList.remove('sunday-column-dragging');
        state?.grip?.classList.remove('is-grabbing');
        state?.sourceWrapper?.classList.remove('is-dragging');
        if (state?.columnId != null) {
            setColumnHighlight(state.columnId, false);
        }
        try { state?.grip?.releasePointerCapture?.(state.pointerId); } catch {}
        if (columnDragAvatar) { columnDragAvatar.remove(); columnDragAvatar = null; }
        const target = state?.dropTarget;
        if (!state || !target) {
            clearDragIndicators();
            return;
        }
        target.wrapper.classList.remove('is-drop-before', 'is-drop-after');
        await persistColumnReorder(state.columnId, target.targetId, target.isAfter);
    }

    function clearDragIndicators() {
        const indicators = boardListEl.querySelectorAll('.sunday-column-header.is-drop-before, .sunday-column-header.is-drop-after');
        indicators.forEach((el) => el.classList.remove('is-drop-before', 'is-drop-after'));
    }

    function resetColumnDragState() {
        if (!columnDragState) {
            return;
        }
        if (columnDragState.grip && typeof columnDragState.grip.releasePointerCapture === 'function' && columnDragState.pointerId != null) {
            try {
                columnDragState.grip.releasePointerCapture(columnDragState.pointerId);
            } catch (error) {
                // ignore
            }
        }
        columnDragState.sourceWrapper?.classList.remove('is-drag-ready', 'is-dragging');
        columnDragState.sourceWrapper?.removeAttribute('data-drag-ready');
        columnDragState.grip?.classList.remove('is-grabbing');
        document.body.classList.remove('sunday-column-dragging');
        if (columnDragState.columnId != null) {
            setColumnHighlight(columnDragState.columnId, false);
        }
        clearDragIndicators();
        columnDragState = null;
    }

    function setColumnHighlight(columnId, enable) {
        const selector = `.sunday-table__head-cell[data-column-id="${columnId}"], .sunday-cell[data-column-id="${columnId}"]`;
        const nodes = boardListEl.querySelectorAll(selector);
        nodes.forEach((el) => {
            if (enable) el.classList.add('sunday-col-highlight');
            else el.classList.remove('sunday-col-highlight');
        });
    }

    async function persistColumnReorder(sourceId, targetId, isAfter) {
        if (!currentBoard) {
            return;
        }
        const restIds = reorderableColumns.map((column) => column.id);
        const sourceIndex = restIds.indexOf(sourceId);
        const targetIndex = restIds.indexOf(targetId);
        if (sourceIndex === -1 || targetIndex === -1) {
            return;
        }
        const sequence = restIds.slice();
        sequence.splice(sourceIndex, 1);
        const adjustedTargetIndex = sequence.indexOf(targetId);
        const insertIndex = Math.max(0, Math.min(sequence.length, adjustedTargetIndex + (isAfter ? 1 : 0)));
        sequence.splice(insertIndex, 0, sourceId);
        const desiredPosition = observationColumns.length + sequence.indexOf(sourceId);
        try {
            const board = await fetchJSON(`${boardsEndpoint.replace('/boards', '/columns')}/${sourceId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ position: desiredPosition }),
            });
            setCurrentBoard(board);
        } catch (error) {
            console.error(error);
            showToast('Não foi possível mover a coluna.');
        }
    }

    function setupRowDrag(handle, rowEl, itemId, groupId) {
        if (!handle || !rowEl) {
            return;
        }
        handle.addEventListener('pointerdown', (event) => beginRowPointerDrag(event, rowEl, handle, itemId, groupId));
        handle.addEventListener('click', (event) => event.preventDefault());
    }

    function beginRowPointerDrag(event, rowEl, handle, itemId, groupId) {
        if (rowDragState?.dragging) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        rowDragState = {
            itemId,
            groupId,
            sourceRow: rowEl,
            handle,
            pointerId: event.pointerId,
            dragging: true,
            dropTarget: null,
        };
        document.body.classList.add('sunday-row-dragging');
        handle.classList.add('is-grabbing');
        setRowHighlight(rowEl, true);
        if (typeof handle.setPointerCapture === 'function') {
            try { handle.setPointerCapture(event.pointerId); } catch (_) {}
        }
        const title = rowEl.querySelector('.sunday-cell--item')?.textContent?.trim() || 'Linha';
        rowDragAvatar = document.createElement('div');
        rowDragAvatar.className = 'sunday-row-drag-avatar';
        rowDragAvatar.textContent = title;
        document.body.appendChild(rowDragAvatar);
        moveRowDragAvatar(event.clientX, event.clientY);
        window.addEventListener('pointermove', onRowPointerDragMove);
        window.addEventListener('pointerup', onRowPointerDragEnd, { once: true });
        window.addEventListener('pointercancel', onRowPointerDragEnd, { once: true });
    }

    function moveRowDragAvatar(x, y) {
        if (!rowDragAvatar) {
            return;
        }
        rowDragAvatar.style.transform = `translate(${Math.round(x + 12)}px, ${Math.round(y + 12)}px)`;
    }

    function findRowTargetAt(x, y) {
        const el = document.elementFromPoint(x, y);
        const row = el?.closest?.('.sunday-table__row');
        if (!row) {
            return null;
        }
        const groupId = Number(row.dataset.groupId);
        const itemId = Number(row.dataset.itemId);
        if (!itemId || !rowDragState || groupId !== rowDragState.groupId || itemId === rowDragState.itemId) {
            return null;
        }
        const rect = row.getBoundingClientRect();
        const isAfter = y - rect.top > rect.height / 2;
        return { row, itemId, isAfter };
    }

    function onRowPointerDragMove(event) {
        if (!rowDragState?.dragging) {
            return;
        }
        moveRowDragAvatar(event.clientX, event.clientY);
        const target = findRowTargetAt(event.clientX, event.clientY);
        if (!target) {
            if (rowDragState.dropTarget) {
                rowDragState.dropTarget.row.classList.remove('is-row-drop-before', 'is-row-drop-after');
                rowDragState.dropTarget = null;
            }
            return;
        }
        if (rowDragState.dropTarget && rowDragState.dropTarget.row !== target.row) {
            rowDragState.dropTarget.row.classList.remove('is-row-drop-before', 'is-row-drop-after');
        }
        target.row.classList.toggle('is-row-drop-after', target.isAfter);
        target.row.classList.toggle('is-row-drop-before', !target.isAfter);
        rowDragState.dropTarget = target;
    }

    async function onRowPointerDragEnd() {
        const state = rowDragState;
        rowDragState = null;
        window.removeEventListener('pointermove', onRowPointerDragMove);
        document.body.classList.remove('sunday-row-dragging');
        if (state?.handle) {
            state.handle.classList.remove('is-grabbing');
            if (typeof state.handle.releasePointerCapture === 'function' && state.pointerId != null) {
                try { state.handle.releasePointerCapture(state.pointerId); } catch (_) {}
            }
        }
        setRowHighlight(state?.sourceRow, false);
        if (rowDragAvatar) {
            rowDragAvatar.remove();
            rowDragAvatar = null;
        }
        const target = state?.dropTarget;
        clearRowDropIndicators();
        if (!state || !target) {
            return;
        }
        await persistRowReorder(state.itemId, state.groupId, target.itemId, target.isAfter);
    }

    function clearRowDropIndicators() {
        boardListEl.querySelectorAll('.sunday-table__row.is-row-drop-before, .sunday-table__row.is-row-drop-after')
            .forEach((row) => row.classList.remove('is-row-drop-before', 'is-row-drop-after'));
    }

    function setRowHighlight(rowEl, enable) {
        if (!rowEl) {
            return;
        }
        rowEl.classList.toggle('sunday-row-highlight', enable);
        rowEl.querySelectorAll('.sunday-cell').forEach((cell) => {
            cell.classList.toggle('sunday-row-highlight', enable);
        });
    }

    async function persistRowReorder(itemId, groupId, targetItemId, isAfter) {
        if (!currentBoard) {
            return;
        }
        const group = currentBoard.groups?.find((g) => g.id === groupId);
        if (!group) {
            return;
        }
        const orderedIds = [...(group.items || [])]
            .sort((a, b) => a.position - b.position)
            .map((item) => item.id);
        const sourceIndex = orderedIds.indexOf(itemId);
        const targetIndex = orderedIds.indexOf(targetItemId);
        if (sourceIndex === -1 || targetIndex === -1) {
            return;
        }
        orderedIds.splice(sourceIndex, 1);
        const adjustedIndex = orderedIds.indexOf(targetItemId);
        const insertIndex = Math.max(0, Math.min(orderedIds.length, adjustedIndex + (isAfter ? 1 : 0)));
        orderedIds.splice(insertIndex, 0, itemId);
        const desiredPosition = orderedIds.indexOf(itemId) + 1;
        try {
            const board = await fetchJSON(`${boardsEndpoint.replace('/boards', '/items')}/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ position: desiredPosition, group_id: groupId }),
            });
            setCurrentBoard(board);
        } catch (error) {
            console.error(error);
            showToast('Não foi possível mover a linha.');
        }
    }

    function ensureSelectionSet(groupId) {
        if (!selectedRows.has(groupId)) {
            selectedRows.set(groupId, new Set());
        }
        return selectedRows.get(groupId);
    }

    function updateGroupSelectionUI(groupId) {
        const selection = ensureSelectionSet(groupId);
        const groupEl = boardListEl.querySelector(`.sunday-group[data-group-id="${groupId}"]`);
        if (!groupEl) {
            return;
        }
        const deleteBtn = groupEl.querySelector('[data-action="delete-selected"]');
        if (deleteBtn) {
            const hasSelection = selection.size > 0;
            deleteBtn.hidden = !hasSelection;
            deleteBtn.disabled = !hasSelection;
            const label = hasSelection
                ? `Excluir ${selection.size} linha${selection.size > 1 ? 's' : ''}`
                : 'Excluir linhas selecionadas';
            deleteBtn.setAttribute('aria-label', label);
            deleteBtn.title = label;
        }
        const rows = groupEl.querySelectorAll('.sunday-table__row');
        rows.forEach((row) => {
            const rowId = Number(row.dataset.itemId);
            const isSelected = selection.has(rowId);
            row.classList.toggle('is-selected', isSelected);
            const checkbox = row.querySelector('input[data-select-row]');
            if (checkbox) {
                checkbox.checked = isSelected;
            }
        });
    }

    async function deleteSelectedRows(groupId) {
        const selection = ensureSelectionSet(groupId);
        if (!selection.size) {
            return;
        }
        const confirm = await confirmAction({
            title: 'Excluir linhas selecionadas',
            message: selection.size === 1 ? 'Deseja excluir a linha selecionada?' : `Deseja excluir ${selection.size} linhas selecionadas?`,
            confirmText: 'Excluir',
        });
        if (!confirm) {
            return;
        }
        try {
            const itemIds = Array.from(selection);
            let latestBoard = currentBoard;
            for (const itemId of itemIds) {
                latestBoard = await fetchJSON(`${boardsEndpoint.replace('/boards', '/items')}/${itemId}`, {
                    method: 'DELETE',
                });
            }
            selectedRows.set(groupId, new Set());
            updateGroupSelectionUI(groupId);
            if (latestBoard) {
                setCurrentBoard(latestBoard);
                await loadBoardDetail(latestBoard.id);
            } else if (currentBoard) {
                await loadBoardDetail(currentBoard.id);
            }
            showToast(itemIds.length === 1 ? 'Linha excluída.' : 'Linhas excluídas.');
        } catch (error) {
            console.error(error);
            showToast('Não foi possível excluir as linhas selecionadas.');
            if (currentBoard) {
                await loadBoardDetail(currentBoard.id);
            }
        }
    }

    function parseLocalDate(value) {
        if (typeof value !== 'string') {
            return null;
        }
        const match = value.match(/^\s*(\d{4})-(\d{2})-(\d{2})\s*$/);
        if (!match) {
            return null;
        }
        const [, yearStr, monthStr, dayStr] = match;
        const year = Number(yearStr);
        const month = Number(monthStr);
        const day = Number(dayStr);
        if ([year, month, day].some(Number.isNaN)) {
            return null;
        }
        const date = new Date(year, month - 1, day);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function formatCellValue(type, rawValue) {
        if (!rawValue) {
            return '';
        }
        if (type === 'date') {
            const parsed = parseLocalDate(rawValue);
            if (parsed) {
                return parsed.toLocaleDateString('pt-BR');
            }
            const date = new Date(rawValue);
            if (!Number.isNaN(date.getTime())) {
                return date.toLocaleDateString('pt-BR');
            }
        }
        return rawValue;
    }

    function closeBoardMenu() {
        currentBoardMenu?.remove();
        currentBoardMenu = null;
    }

    function closeColumnMenu() {
        currentColumnMenu?.remove();
        currentColumnMenu = null;
    }

    function closeGroupMenu() {
        if (currentGroupMenu) {
            currentGroupMenu.remove();
            currentGroupMenu = null;
        }
        if (currentGroupMenuHandler) {
            document.removeEventListener('click', currentGroupMenuHandler, true);
            currentGroupMenuHandler = null;
        }
    }

    function positionFloatingMenu(menu, triggerRect, options = {}) {
        const { alignRight = true, offset = 8 } = options;
        menu.style.position = 'fixed';
        requestAnimationFrame(() => {
            const menuRect = menu.getBoundingClientRect();
            let top = triggerRect.bottom + offset;
            let left = alignRight ? triggerRect.right - menuRect.width : triggerRect.left;

            if (left + menuRect.width > window.innerWidth - 12) {
                left = window.innerWidth - menuRect.width - 12;
            }
            if (left < 12) {
                left = 12;
            }

            if (top + menuRect.height > window.innerHeight - 12) {
                top = triggerRect.top - menuRect.height - offset;
            }
            if (top < 12) {
                top = 12;
            }

            menu.style.top = `${Math.round(top)}px`;
            menu.style.left = `${Math.round(left)}px`;
        });
    }

    function toggleBoardMenu(trigger) {
        if (currentBoardMenu) {
            closeBoardMenu();
            return;
        }
        closeColumnMenu();
        closeGroupMenu();
        closeLabelPicker();
        closeInlineEditor();
        const menu = document.createElement('div');
        menu.className = 'sunday-board-menu';
        menu.innerHTML = `
            <ul>
                <li data-action="board-hide"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.875 18.825a10 10 0 0 1-2.875.425C4.5 19.25 1 12 1 12a17.38 17.38 0 0 1 3.315-4.605"></path><path d="M9.88 4.32A9.99 9.99 0 0 1 12 4.25C19.5 4.25 23 11.5 23 11.5a17.424 17.424 0 0 1-2.023 3.06"></path><path d="M1 1l22 22"></path></svg> Ocultar quadro</li>
                <li data-action="board-delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-2 14H7L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg> Excluir quadro</li>
            </ul>
        `;
        document.body.appendChild(menu);
        currentBoardMenu = menu;

        const triggerRect = trigger.getBoundingClientRect();
        positionFloatingMenu(menu, triggerRect, { alignRight: true, offset: 10 });

        const closeMenu = (event) => {
            if (!menu.contains(event.target) && event.target !== trigger) {
                closeBoardMenu();
                document.removeEventListener('click', closeMenu, true);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu, true), 0);

        menu.addEventListener('click', async (event) => {
            const option = event.target.closest('[data-action]');
            if (!option) {
                return;
            }
            const action = option.dataset.action;
            closeBoardMenu();
            if (!currentBoard) {
                showToast('Nenhum quadro selecionado.');
                return;
            }
            if (action === 'board-hide') {
                await archiveBoard(currentBoard.id, true);
            } else if (action === 'board-delete') {
                await deleteBoard(currentBoard.id);
            }
        });
    }

    function toggleColumnMenu(trigger, columnId) {
        if (currentColumnMenu) {
            closeColumnMenu();
            return;
        }
        closeBoardMenu();
        closeGroupMenu();
        closeLabelPicker();
        closeInlineEditor();
        const menu = document.createElement('div');
        menu.className = 'sunday-board-menu';
        menu.innerHTML = `
            <ul>
                <li data-action="rename-column" data-column-id="${columnId}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg> Renomear</li>
                <li data-action="customize-column" data-column-id="${columnId}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M12 4V2"></path><path d="M12 20v2"></path><path d="M4.22 4.22 5.64 5.64"></path><path d="M18.36 18.36 19.78 19.78"></path><path d="M1 12h2"></path><path d="M21 12h2"></path><path d="M4.22 19.78 5.64 18.36"></path><path d="M18.36 5.64 19.78 4.22"></path></svg> Personalizar</li>
                <li data-action="delete-column" data-column-id="${columnId}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-2 14H7L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg> Excluir</li>
            </ul>
        `;
        document.body.appendChild(menu);
        currentColumnMenu = menu;

        const triggerRect = trigger.getBoundingClientRect();
        positionFloatingMenu(menu, triggerRect, { alignRight: true, offset: 8 });

        const closeMenu = (event) => {
            if (!menu.contains(event.target) && event.target !== trigger) {
                closeColumnMenu();
                document.removeEventListener('click', closeMenu, true);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu, true), 0);

        menu.addEventListener('click', (event) => {
            const option = event.target.closest('[data-action]');
            if (!option) {
                return;
            }
            const action = option.dataset.action;
            const targetColumnId = Number(option.dataset.columnId);
            closeColumnMenu();
            if (action === 'rename-column') {
                startInlineColumnRename(targetColumnId);
            } else if (action === 'customize-column') {
                openColumnCustomizeModal(targetColumnId);
            } else if (action === 'delete-column') {
                confirmDeleteColumn(targetColumnId);
            }
        });
    }

    function toggleGroupMenu(trigger, groupId) {
        if (currentGroupMenu) {
            closeGroupMenu();
            return;
        }
        if (!groupId) {
            return;
        }
        closeBoardMenu();
        closeColumnMenu();
        closeLabelPicker();
        closeInlineEditor();
        const menu = document.createElement('div');
        menu.className = 'sunday-board-menu';
        menu.innerHTML = `
            <ul>
                <li data-action="rename-group" data-group-id="${groupId}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg> Renomear</li>
                <li data-action="change-group-color" data-group-id="${groupId}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 10.35 3H11a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V11c0 .66.26 1.3.73 1.77z"></path></svg> Alterar cor</li>
                <li data-action="delete-group" data-group-id="${groupId}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-2 14H7L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg> Excluir tabela</li>
            </ul>
        `;
        document.body.appendChild(menu);
        currentGroupMenu = menu;

        const triggerRect = trigger.getBoundingClientRect();
        positionFloatingMenu(menu, triggerRect, { alignRight: true, offset: 8 });

        currentGroupMenuHandler = (event) => {
            if (!menu.contains(event.target) && event.target !== trigger) {
                closeGroupMenu();
            }
        };
        setTimeout(() => document.addEventListener('click', currentGroupMenuHandler, true), 0);

        menu.addEventListener('click', async (event) => {
            const option = event.target.closest('[data-action]');
            if (!option) {
                return;
            }
            const action = option.dataset.action;
            const targetGroupId = Number(option.dataset.groupId);
            closeGroupMenu();
            if (action === 'rename-group') {
                startInlineGroupRename(targetGroupId);
            } else if (action === 'change-group-color') {
                closeGroupMenu();
                // paleta rápida
                const colors = ['#4361EE', '#21d4fd', '#43cea2', '#ff6b6b', '#f7b731', '#8e44ad'];
                const palette = document.createElement('div');
                palette.className = 'sunday-board-menu';
                palette.innerHTML = `<ul style="display:flex;gap:8px;padding:8px 12px;">${colors.map(c => `<li data-action="apply-group-color" data-group-id="${targetGroupId}" data-color="${c}" title="${c}" style="width:18px;height:18px;border-radius:50%;background:${c};border:1px solid rgba(0,0,0,.15);"></li>`).join('')}</ul>`;
                document.body.appendChild(palette);
                const rect = trigger.getBoundingClientRect();
                positionFloatingMenu(palette, rect, { alignRight: true, offset: 8 });
                const closer = (ev) => {
                    if (!palette.contains(ev.target)) {
                        palette.remove();
                        document.removeEventListener('click', closer, true);
                    }
                };
                setTimeout(() => document.addEventListener('click', closer, true), 0);
                palette.addEventListener('click', async (ev) => {
                    const sw = ev.target.closest('[data-action="apply-group-color"]');
                    if (!sw) return;
                    const color = sw.dataset.color;
                    try {
                        const board = await fetchJSON(`${boardsEndpoint.replace('/boards', '/groups')}/${targetGroupId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ color_hex: color })
                        });
                        // Atualização imediata sem refresh: aplicar cor no DOM e estado
                        if (board && board.id) {
                            setCurrentBoard(board);
                        } else {
                            // fallback: atualizar apenas o grupo atual no DOM
                            const groupEl = boardListEl.querySelector(`.sunday-group[data-group-id="${targetGroupId}"]`);
                            if (groupEl) {
                                groupEl.style.setProperty('--sunday-group-accent', color);
                                const title = groupEl.querySelector('.sunday-group__title strong');
                                if (title) title.style.color = color;
                            }
                        }
                    } catch (e) { console.error(e); }
                    palette.remove();
                });
            } else if (action === 'delete-group') {
                await deleteGroup(targetGroupId);
            }
        });
    }

    function renderColumnLabels(columnType, labels) {
        if (!columnLabelsSection) {
            return;
        }
        if (columnType === 'status' || columnType === 'label') {
            columnLabelsSection.hidden = false;
            columnLabelList.innerHTML = '';
            labels.forEach((label) => addLabelRow(label));
            if (!labels.length) {
                addLabelRow();
            }
        } else {
            columnLabelsSection.hidden = true;
            columnLabelList.innerHTML = '';
        }
    }

    function addLabelRow(label = null) {
        const row = document.createElement('div');
        row.className = 'sunday-label-row';
        row.innerHTML = `
            <input type="text" name="label-text" placeholder="Nome da etiqueta" value="${label?.text || ''}" required maxlength="60">
            <input type="color" name="label-color" value="${label?.color || '#4361EE'}">
            <button type="button" data-action="remove-label" title="Remover etiqueta">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;
        row.dataset.labelId = label?.id || '';
        columnLabelList.appendChild(row);
    }

    function collectLabelData() {
        const rows = Array.from(columnLabelList.querySelectorAll('.sunday-label-row'));
        return rows
            .map((row, index) => {
                const textInput = row.querySelector('input[name="label-text"]');
                const colorInput = row.querySelector('input[name="label-color"]');
                const text = (textInput.value || '').trim();
                if (!text) {
                    return null;
                }
                const color = colorInput.value || '#4361EE';
                const id = row.dataset.labelId || `label-${Date.now()}-${index}`;
                return { id, text, color };
            })
            .filter(Boolean);
    }

    function closeLabelPicker() {
        if (currentLabelPicker) {
            currentLabelPicker.remove();
            currentLabelPicker = null;
        }
        if (currentLabelPickerHandler) {
            document.removeEventListener('click', currentLabelPickerHandler, true);
            currentLabelPickerHandler = null;
        }
    }

    function closeInlineEditor() {
        if (currentInlineEditor) {
            const fpInput = currentInlineEditor.querySelector('input');
            if (fpInput?.__fpInstance) {
                try { fpInput.__fpInstance.destroy(); } catch (_) {}
            } else if (fpInput?._flatpickr) {
                try { fpInput._flatpickr.destroy(); } catch (_) {}
            }
        }
        if (currentInlineEditorHandler) {
            document.removeEventListener('click', currentInlineEditorHandler, true);
            currentInlineEditorHandler = null;
        }
        if (currentInlineEditorCell && currentInlineEditorCell.isConnected) {
            const cell = currentInlineEditorCell;
            cell.classList.remove('is-editing');
            if (currentInlineEditor && cell.contains(currentInlineEditor)) {
                currentInlineEditor.remove();
            }
            if (Array.isArray(currentInlineEditorPreviousNodes)) {
                cell.innerHTML = '';
                currentInlineEditorPreviousNodes.forEach((node) => cell.appendChild(node.cloneNode(true)));
            }
        } else if (currentInlineEditor) {
            currentInlineEditor.remove();
        }
        currentInlineEditor = null;
        currentInlineEditorCell = null;
        currentInlineEditorPreviousNodes = null;
    }

    function cancelPendingConfirm() {
        if (pendingConfirmResolve) {
            const resolve = pendingConfirmResolve;
            const cleanup = pendingConfirmCleanup;
            pendingConfirmResolve = null;
            pendingConfirmCleanup = null;
            cleanup?.();
            closeModal(confirmModal);
            resolve(false);
        }
    }

    function confirmAction({ title = 'Confirmar ação', message = 'Tem certeza que deseja prosseguir?', confirmText = 'Confirmar', cancelText = 'Cancelar' } = {}) {
        if (!confirmModal) {
            return Promise.resolve(window.confirm(message));
        }
        return new Promise((resolve) => {
            if (pendingConfirmResolve) {
                cancelPendingConfirm();
            }

            if (confirmTitleEl) {
                confirmTitleEl.textContent = title;
            }
            if (confirmMessageEl) {
                confirmMessageEl.textContent = message;
            }
            if (confirmOkBtn) {
                confirmOkBtn.textContent = confirmText;
            }
            if (confirmCancelBtn) {
                confirmCancelBtn.textContent = cancelText;
            }

            const cleanup = () => {
                pendingConfirmResolve = null;
                pendingConfirmCleanup = null;
                confirmOkBtn?.removeEventListener('click', onConfirm);
                confirmCancelBtn?.removeEventListener('click', onCancel);
            };

            const onConfirm = () => {
                cleanup();
                closeModal(confirmModal);
                resolve(true);
            };

            const onCancel = () => {
                cleanup();
                closeModal(confirmModal);
                resolve(false);
            };

            pendingConfirmResolve = resolve;
            pendingConfirmCleanup = cleanup;

            confirmOkBtn?.addEventListener('click', onConfirm, { once: true });
            confirmCancelBtn?.addEventListener('click', onCancel, { once: true });

            openModal(confirmModal);
        });
    }

    function openObservationSidebar(cellContext) {
        if (!observationSidebar) {
            showToast('Área de observações não disponível.');
            return;
        }
        observationState = cellContext;
        observationSidebar.classList.add('is-open');
        observationSidebar.setAttribute('aria-hidden', 'false');
        const { cell, item } = getCellById(currentBoard, cellContext.cellId) || {};
        const friendlyDate = new Date().toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });
        observationTitle.textContent = item?.title || 'Observações';
        observationSubtitle.textContent = `Sincronizado em ${friendlyDate}`;
        renderObservationComments(cell);
    }

    function closeObservationSidebar() {
        observationSidebar?.classList.remove('is-open');
        observationSidebar?.setAttribute('aria-hidden', 'true');
        observationState = null;
        formObservation?.reset();
        closeCommentMenu();
    }

    function renderObservationComments(cell) {
        if (!observationComments) {
            return;
        }
        closeCommentMenu();
        const comments = Array.isArray(cell?.comments) ? cell.comments : [];
        comments.forEach(enhanceCommentAuthorMetadata);
        const total = comments.length;
        if (observationCount) {
            observationCount.textContent = String(total);
        }
        if (observationTabCount) {
            observationTabCount.textContent = String(total);
        }
        renderObservationSubscribers(comments);
        observationComments.innerHTML = '';
        if (!total) {
            const empty = document.createElement('div');
            empty.className = 'observation-feed__empty';
            empty.innerHTML = `
                <strong>Nenhuma atualização registrada</strong>
                <p>Registre decisões, anexe links ou compartilhe comentários para manter o time sincronizado.</p>
            `;
            observationComments.appendChild(empty);
            updateObservationButtonCount(cell);
            return;
        }
        const ordered = sortObservationComments(comments);
        ordered.forEach((comment) => {
            observationComments.appendChild(createObservationComment(comment));
        });
        updateObservationButtonCount(cell);
    }

    function renderObservationSubscribers(comments) {
        if (!observationSubscribers) {
            return;
        }
        observationSubscribers.innerHTML = '';
        const uniqueAuthors = [];
        const dedupe = new Set();
        comments.forEach((comment) => {
            const label = getCommentAuthor(comment);
            const key = comment.author_id ?? label;
            if (dedupe.has(key)) {
                return;
            }
            dedupe.add(key);
            uniqueAuthors.push({ label, seed: key });
        });
        const fallbackLabel = currentUser.fullName || currentUser.username || 'Colaborador';
        const fallbackSeed = currentUser.id || fallbackLabel;
        const source = uniqueAuthors.length ? uniqueAuthors : [{ label: fallbackLabel, seed: fallbackSeed }];
        source.slice(0, 3).forEach(({ label, seed }) => {
            const avatar = document.createElement('span');
            avatar.className = 'observation-panel__avatar';
            const { background, color } = getAvatarColors(seed);
            avatar.style.background = background;
            avatar.style.color = color;
            avatar.textContent = getInitials(label);
            avatar.title = label;
            observationSubscribers.appendChild(avatar);
        });
        if (source.length > 3) {
            const extra = document.createElement('span');
            extra.className = 'observation-panel__avatar';
            extra.textContent = `+${source.length - 3}`;
            extra.title = `${source.length - 3} colaboradores adicionais`;
            observationSubscribers.appendChild(extra);
        }
        const invite = document.createElement('span');
        invite.className = 'observation-panel__avatar is-placeholder';
        invite.textContent = '+';
        invite.title = 'Adicionar colaborador';
        observationSubscribers.appendChild(invite);
    }

    function createObservationComment(comment) {
        const commentEl = document.createElement('article');
        commentEl.className = 'observation-comment';
        const authorName = getCommentAuthor(comment);
        const timestamp = formatObservationDate(comment?.created_at) || 'Agora mesmo';
        const avatarSource = comment?.author_avatar;
        const { background, color } = getAvatarColors(comment?.author_id ?? authorName);
        const avatarHtml = avatarSource
            ? `<span class="observation-comment__avatar is-image"><img src="${avatarSource}" alt="${authorName}"></span>`
            : `<span class="observation-comment__avatar" style="background:${background};color:${color};">${getInitials(authorName)}</span>`;
        const formattedContent = renderRichText(comment?.content || '');
        const pinBadge = comment?.is_pinned ? '<span class="observation-comment__pin">Fixado</span>' : '';
        commentEl.innerHTML = `
            <div class="observation-comment__header">
                <div class="observation-comment__author">
                    ${avatarHtml}
                    <div class="observation-comment__meta">
                        <strong>${authorName}</strong>
                        <span>${timestamp}</span>
                    </div>
                    ${pinBadge}
                </div>
                <button type="button" class="observation-icon-button" data-action="comment-menu" data-comment-id="${comment.id}" title="Opções da atualização">
                    ${ICON_MORE}
                </button>
            </div>
            <div class="observation-comment__body">
                ${formattedContent || '<p><br></p>'}
            </div>
            <div class="observation-comment__footer">
                <button type="button">Curtir</button>
                <button type="button">Responder</button>
            </div>
        `;
        commentEl.dataset.commentId = String(comment.id);
        commentEl.classList.toggle('is-pinned', Boolean(comment.is_pinned));
        return commentEl;
    }

    function refreshObservationSidebar() {
        if (!observationState) {
            return;
        }
        const { cell } = getCellById(currentBoard, observationState.cellId) || {};
        if (cell) {
            renderObservationComments(cell);
            updateObservationButtonCount(cell);
        }
    }

    async function toggleCommentPin(commentId, shouldPin) {
        if (!observationState) {
            return;
        }
        try {
            const updated = await fetchJSON(`${boardsEndpoint.replace('/boards', '/cells')}/${observationState.cellId}/comments/${commentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_pinned: shouldPin }),
            });
            enhanceCommentAuthorMetadata(updated);
            const context = getActiveObservationContext();
            if (context) {
                const comments = context.cell.comments || [];
                const index = comments.findIndex((item) => item.id === commentId);
                if (index >= 0) {
                    comments[index] = { ...comments[index], ...updated };
                }
                renderObservationComments(context.cell);
            }
            showToast(shouldPin ? 'Comentário fixado no topo.' : 'Comentário desafixado.');
        } catch (error) {
            console.error(error);
            showToast('Não foi possível atualizar o comentário.');
        }
    }

    async function deleteObservationComment(commentId) {
        if (!observationState) {
            return;
        }
        try {
            const response = await fetch(`${boardsEndpoint.replace('/boards', '/cells')}/${observationState.cellId}/comments/${commentId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error(`Erro ${response.status}`);
            }
            const context = getActiveObservationContext();
            if (context) {
                context.cell.comments = (context.cell.comments || []).filter((comment) => comment.id !== commentId);
                renderObservationComments(context.cell);
            }
            showToast('Comentário excluído.');
        } catch (error) {
            console.error(error);
            showToast('Não foi possível excluir o comentário.');
        }
    }

    function openStatusPicker(cellEl, column, cellData) {
        closeLabelPicker();
        const picker = document.createElement('div');
        picker.className = 'sunday-label-picker';
        const labels = getLabelOptions(column);
        if (!labels.length) {
            picker.innerHTML = '<span>Nenhuma etiqueta configurada.</span>';
        } else {
            labels.forEach((label) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.dataset.action = 'select-label';
                button.dataset.labelId = label.id;
                button.dataset.cellId = cellData.id;
                button.dataset.columnId = column.id;
                button.innerHTML = `
                    <span>${label.text}</span>
                    <span class="sunday-label-picker__swatch" style="background:${label.color}"></span>
                `;
                picker.appendChild(button);
            });
            const clear = document.createElement('button');
            clear.type = 'button';
            clear.dataset.action = 'clear-label';
            clear.dataset.cellId = cellData.id;
            clear.dataset.columnId = column.id;
            clear.textContent = 'Limpar seleção';
            picker.appendChild(clear);
        }

        document.body.appendChild(picker);

        const rect = cellEl.getBoundingClientRect();
        picker.style.top = `${rect.bottom + window.scrollY + 6}px`;
        picker.style.left = `${rect.left + window.scrollX}px`;

        currentLabelPicker = picker;
        currentLabelPickerHandler = (event) => {
            if (!picker.contains(event.target)) {
                closeLabelPicker();
            }
        };
        setTimeout(() => document.addEventListener('click', currentLabelPickerHandler, true), 0);

        // Capturar cliques dentro do picker (fora do wrapper)
        picker.addEventListener('click', (ev) => {
            const btn = ev.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            if (action === 'select-label') {
                const cellId = Number(btn.dataset.cellId || cellData.id);
                const colId = Number(btn.dataset.columnId || column.id);
                const labelId = btn.dataset.labelId;
                updateCellValue(cellId, labelId, colId);
                closeLabelPicker();
            } else if (action === 'clear-label') {
                const cellId = Number(btn.dataset.cellId || cellData.id);
                const colId = Number(btn.dataset.columnId || column.id);
                updateCellValue(cellId, null, colId);
                closeLabelPicker();
            }
            ev.stopPropagation();
        });
    }

    function openInlineEditor(cellEl, initialValue, inputType = 'text') {
        closeInlineEditor();
        const editor = document.createElement('div');
        editor.className = 'sunday-inline-editor';
        const input = document.createElement('input');
        input.type = inputType;
        input.value = initialValue ?? '';
        editor.appendChild(input);

        const previousNodes = Array.from(cellEl.childNodes).map((node) => node.cloneNode(true));
        cellEl.classList.add('is-editing');
        cellEl.innerHTML = '';
        cellEl.appendChild(editor);

        currentInlineEditor = editor;
        currentInlineEditorCell = cellEl;
        currentInlineEditorPreviousNodes = previousNodes;
        currentInlineEditorHandler = (event) => {
            if (cellEl.contains(event.target)) {
                return;
            }
            if (event.target.closest && event.target.closest('.flatpickr-calendar')) {
                return;
            }
            closeInlineEditor();
        };
        setTimeout(() => document.addEventListener('click', currentInlineEditorHandler, true), 0);

        input.focus();
        if (input.type !== 'date') {
            input.select();
        }

        return input;
    }

    modalOverlay?.addEventListener('click', () => {
        closeModal(modalCreateBoard);
        closeModal(modalCreateGroup);
        closeModal(modalManageColumn);
        closeModal(modalCreateItem);
        closeModal(confirmModal);
        closeObservationSidebar();
        closeBoardMenu();
        closeColumnMenu();
        closeGroupMenu();
        closeLabelPicker();
        closeInlineEditor();
        cancelPendingConfirm();
    });

    wrapper.querySelectorAll('[data-modal-close]').forEach((btn) => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            const modal = btn.closest('.sunday-modal');
            closeModal(modal);
            if (modal === confirmModal) {
                cancelPendingConfirm();
            }
        });
    });

    boardSidebarList.addEventListener('click', async (event) => {
        const item = event.target.closest('[data-board-id]');
        if (!item) {
            return;
        }
        const boardId = Number(item.dataset.boardId);
        if (boardId && boardId !== activeBoardId) {
            await loadBoardDetail(boardId);
        }
    });

    wrapper.addEventListener('change', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement) || !target.hasAttribute('data-select-row')) {
            return;
        }
        const groupId = Number(target.dataset.groupId);
        const itemId = Number(target.dataset.itemId);
        if (Number.isNaN(groupId) || Number.isNaN(itemId)) {
            return;
        }
        const selection = ensureSelectionSet(groupId);
        if (target.checked) {
            selection.add(itemId);
        } else {
            selection.delete(itemId);
        }
        updateGroupSelectionUI(groupId);
        event.stopPropagation();
    });

    wrapper.addEventListener('click', async (event) => {
        const actionElement = event.target.closest('[data-action]');
        if (!actionElement) {
            return;
        }

        const action = actionElement.dataset.action;

        if (action === 'create-board') {
            openModal(modalCreateBoard);
            return;
        }

        if (action === 'create-group') {
            if (!currentBoard) {
                showToast('Selecione um quadro primeiro.');
                return;
            }
            openModal(modalCreateGroup);
            return;
        }

        if (action === 'toggle-group') {
            const groupEl = actionElement.closest('.sunday-group');
            const table = groupEl?.querySelector('.sunday-table');
            if (!table) {
                return;
            }
            const isHidden = table.style.display === 'none';
            table.style.display = isHidden ? '' : 'none';
            actionElement.title = isHidden ? 'Recolher tabela' : 'Expandir tabela';
            actionElement.innerHTML = isHidden
                ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>'
                : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>';
            return;
        }

        if (action === 'toggle-sidebar') {
            boardSidebarEl.classList.toggle('is-collapsed');
            return;
        }

        if (action === 'board-menu') {
            toggleBoardMenu(actionElement);
            return;
        }

        if (action === 'column-menu') {
            const columnId = Number(actionElement.dataset.columnId);
            toggleColumnMenu(actionElement, columnId);
            return;
        }
        if (action === 'group-menu') {
            const groupId = Number(actionElement.dataset.groupId);
            toggleGroupMenu(actionElement, groupId);
            return;
        }

        if (action === 'rename-group') {
            closeGroupMenu();
            const groupId = Number(actionElement.dataset.groupId);
            if (groupId) {
                startInlineGroupRename(groupId);
            }
            return;
        }

        if (action === 'rename-board') {
            closeBoardMenu();
            closeColumnMenu();
            closeGroupMenu();
            startInlineBoardRename();
            return;
        }

        if (action === 'delete-selected') {
            const groupId = Number(actionElement.dataset.groupId);
            if (groupId) {
                await deleteSelectedRows(groupId);
            }
            return;
        }

        if (action === 'manage-groups' || action === 'filter' || action === 'group' || action === 'sort' || action === 'people') {
            showToast('Funcionalidade em desenvolvimento.');
            return;
        }

        if (action === 'rename-column') {
            const columnId = Number(actionElement.dataset.columnId);
            startInlineColumnRename(columnId);
            return;
        }

        if (action === 'customize-column') {
            const columnId = Number(actionElement.dataset.columnId);
            openColumnCustomizeModal(columnId);
            return;
        }

        if (action === 'add-column') {
            await addColumnQuick(Number(actionElement.dataset.boardId || currentBoard?.id));
            return;
        }

        if (action === 'comment-menu') {
            const commentId = Number(actionElement.dataset.commentId);
            const context = getActiveObservationContext();
            if (!context) {
                showToast('Selecione uma observação para gerenciar comentários.');
                return;
            }
            const comment = (context.cell.comments || []).find((item) => item.id === commentId);
            if (comment) {
                openCommentMenu(actionElement, comment);
            }
            return;
        }

        if (action === 'pin-comment' || action === 'unpin-comment') {
            const commentId = Number(actionElement.dataset.commentId);
            closeCommentMenu();
            toggleCommentPin(commentId, action === 'pin-comment');
            return;
        }

        if (action === 'delete-comment') {
            const commentId = Number(actionElement.dataset.commentId);
            closeCommentMenu();
            confirmAction({
                title: 'Excluir atualização',
                message: 'Confirma a exclusão definitiva desta atualização?',
                confirmText: 'Excluir',
                cancelText: 'Cancelar',
            }).then((confirmed) => {
                if (confirmed) {
                    deleteObservationComment(commentId);
                }
            });
            return;
        }

        if (action === 'add-item') {
            const groupId = Number(actionElement.dataset.groupId);
            if (!currentBoard || !groupId) {
                showToast('Não foi possível identificar a tabela.');
                return;
            }
            await addQuickItem(currentBoard.id, groupId);
            return;
        }

        if (action === 'rename-item') {
            const itemId = Number(actionElement.dataset.itemId);
            startInlineItemRename(itemId, actionElement);
            return;
        }

        if (action === 'open-observation') {
            const cellId = Number(actionElement.dataset.cellId);
            const groupId = Number(actionElement.dataset.groupId);
            const columnId = Number(actionElement.dataset.columnId);
            const itemId = Number(actionElement.dataset.itemId);
            openObservationSidebar({ cellId, groupId, columnId, itemId });
            return;
        }

        if (action === 'close-observation') {
            closeObservationSidebar();
            return;
        }

        if (action === 'add-label') {
            addLabelRow();
            return;
        }

        if (action === 'remove-label') {
            const row = actionElement.closest('.sunday-label-row');
            row?.remove();
            return;
        }

        if (action === 'delete-column') {
            const columnId = Number(actionElement.dataset.columnId || columnModalColumnId);
            confirmDeleteColumn(columnId);
            return;
        }

        if (action === 'delete-group') {
            const groupId = Number(actionElement.dataset.groupId);
            deleteGroup(groupId);
            return;
        }

        if (action === 'select-label') {
            const cellId = Number(actionElement.dataset.cellId);
            const columnId = Number(actionElement.dataset.columnId);
            const labelId = actionElement.dataset.labelId;
            updateCellValue(cellId, labelId, columnId);
            closeLabelPicker();
            return;
        }

        if (action === 'clear-label') {
            const cellId = Number(actionElement.dataset.cellId);
            const columnId = Number(actionElement.dataset.columnId);
            updateCellValue(cellId, null, columnId);
            closeLabelPicker();
            return;
        }
    });

    boardListEl.addEventListener('click', (event) => {
        const cell = event.target.closest('.sunday-cell');
        if (!cell || !cell.dataset.cellId) {
            return;
        }
        if (cell.dataset.cellType === 'observation') {
            return;
        }
        const columnId = Number(cell.dataset.columnId);
        const cellId = Number(cell.dataset.cellId);
        const column = getColumnById(currentBoard, columnId);
        const { cell: cellData } = getCellById(currentBoard, cellId) || {};
        if (!column || !cellData) {
            return;
        }
        if (column.column_type === 'status' || column.column_type === 'label') {
            openStatusPicker(cell, column, cellData);
        } else if (column.column_type === 'date') {
            openDateEditor(cell, cellData);
        } else {
            openTextEditor(cell, cellData);
        }
    });

    boardListEl.addEventListener('dblclick', (event) => {
        const headerTitleButton = event.target.closest('.sunday-column-header__title');
        if (headerTitleButton) {
            const columnId = Number(headerTitleButton.dataset.columnId);
            startInlineColumnRename(columnId);
            event.preventDefault();
            return;
        }
        const cell = event.target.closest('.sunday-cell');
        if (!cell || !cell.dataset.cellId) {
            return;
        }
        const columnId = Number(cell.dataset.columnId);
        const column = getColumnById(currentBoard, columnId);
        if (!column || column.column_type === 'status' || column.column_type === 'label' || column.column_type === 'observation') {
            return;
        }
        const { cell: cellData } = getCellById(currentBoard, Number(cell.dataset.cellId)) || {};
        if (!cellData) {
            return;
        }
        openTextEditor(cell, cellData);
    });

    function openTextEditor(cellEl, cellData) {
        const input = openInlineEditor(cellEl, cellData.raw_value ?? '');
        let handled = false;
        const commit = async () => {
            if (handled) {
                return;
            }
            handled = true;
            const newValue = input.value;
            await updateCellValue(cellData.id, newValue);
            currentInlineEditorPreviousNodes = newValue ? [document.createTextNode(newValue)] : [];
            closeInlineEditor();
        };
        input.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                await commit();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                closeInlineEditor();
            }
        });
        input.addEventListener('blur', commit, { once: true });
    }

    function openDateEditor(cellEl, cellData) {
        const initialValue = cellData.raw_value || '';
        const input = openInlineEditor(cellEl, initialValue, 'text');
        input.readOnly = true;
        input.classList.add('sunday-inline-date-input');
        input.setAttribute('placeholder', 'Selecione uma data');
        let committed = false;

        const commit = async (value) => {
            if (committed) {
                return;
            }
            committed = true;
            await updateCellValue(cellData.id, value || null);
            const displayValue = formatCellValue('date', value || null);
            currentInlineEditorPreviousNodes = displayValue ? [document.createTextNode(displayValue)] : [];
            closeInlineEditor();
        };

        const cancel = () => {
            if (committed) {
                return;
            }
            committed = true;
            closeInlineEditor();
        };

        input.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                cancel();
            }
        });

        if (window.flatpickr) {
            const locale = window.flatpickr.l10ns?.pt ?? window.flatpickr.l10ns?.default;
            if (locale && window.flatpickr.localize) {
                window.flatpickr.localize(locale);
            }
            let pendingValue = initialValue;
            const maskOutOfMonthDays = (instance) => {
                if (!instance?.calendarContainer) {
                    return;
                }
                const days = instance.calendarContainer.querySelectorAll('.flatpickr-day');
                days.forEach((dayEl) => {
                    if (dayEl.classList.contains('prevMonthDay') || dayEl.classList.contains('nextMonthDay')) {
                        dayEl.style.visibility = 'hidden';
                        dayEl.style.pointerEvents = 'none';
                    } else {
                        dayEl.style.visibility = '';
                        dayEl.style.pointerEvents = '';
                    }
                });
            };
            const fp = window.flatpickr(input, {
                defaultDate: initialValue || null,
                dateFormat: 'Y-m-d',
                altInput: true,
                altFormat: 'd/m/Y',
                allowInput: false,
                disableMobile: true,
                clickOpens: true,
                appendTo: document.body,
                nextArrow: '&rsaquo;',
                prevArrow: '&lsaquo;',
                onReady(selectedDates, dateStr, instance) {
                    input.__fpInstance = instance;
                    instance.calendarContainer.classList.add('sunday-datepicker');
                    const footer = document.createElement('div');
                    footer.className = 'sunday-datepicker__footer';
                    const todayBtn = document.createElement('button');
                    todayBtn.type = 'button';
                    todayBtn.textContent = 'Hoje';
                    todayBtn.addEventListener('click', () => {
                        instance.setDate(new Date(), true);
                        instance.close();
                    });
                    const clearBtn = document.createElement('button');
                    clearBtn.type = 'button';
                    clearBtn.textContent = 'Limpar';
                    clearBtn.addEventListener('click', () => {
                        pendingValue = '';
                        instance.clear();
                        instance.close();
                        commit(null);
                    });
                    footer.append(todayBtn, clearBtn);
                    instance.calendarContainer.appendChild(footer);
                    if (instance.altInput) {
                        instance.altInput.setAttribute('readonly', 'readonly');
                        instance.altInput.classList.add('sunday-inline-date-display');
                    }
                    maskOutOfMonthDays(instance);
                    instance.open();
                },
                onValueUpdate(selectedDates, dateStr, instance) {
                    pendingValue = dateStr;
                    maskOutOfMonthDays(instance);
                },
                onMonthChange(selectedDates, dateStr, instance) {
                    maskOutOfMonthDays(instance);
                },
                onYearChange(selectedDates, dateStr, instance) {
                    maskOutOfMonthDays(instance);
                },
                onClose() {
                    commit(pendingValue || null);
                },
            });
            input.__fpInstance = fp;
        } else {
            input.readOnly = false;
            input.type = 'date';
            input.value = initialValue;
            input.addEventListener('change', () => commit(input.value || null));
            input.addEventListener('blur', () => commit(input.value || null), { once: true });
        }
    }

    function startInlineBoardRename() {
        if (!currentBoard || !boardTitleEl) {
            showToast('Selecione um quadro primeiro.');
            return;
        }
        if (boardTitleEl.classList.contains('is-editing')) {
            return;
        }

        const originalName = currentBoard.name || '';
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'sunday-board-title-input';
        input.value = originalName;
        if (!originalName) {
            input.placeholder = 'Nome do quadro';
        }
        input.setAttribute('aria-label', 'Nome do quadro');

        boardTitleEl.classList.add('is-editing');
        boardTitleEl.textContent = '';
        boardTitleEl.appendChild(input);

        const restore = () => {
            boardTitleEl.classList.remove('is-editing');
            boardTitleEl.classList.add('is-editable');
            boardTitleEl.textContent = originalName || 'Quadro sem título';
            requestAnimationFrame(() => boardTitleEl.focus());
        };

        const finish = async (save) => {
            if (!save) {
                restore();
                return;
            }
            const newName = input.value.trim();
            if (!newName) {
                showToast('Informe um nome para o quadro.');
                restore();
                return;
            }
            if (newName === originalName) {
                restore();
                return;
            }
            try {
                const board = await fetchJSON(`${boardsEndpoint}/${currentBoard.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newName }),
                });
                boardTitleEl.classList.remove('is-editing');
                boardTitleEl.classList.add('is-editable');
                setCurrentBoard(board);
                requestAnimationFrame(() => boardTitleEl.focus());
            } catch (error) {
                console.error(error);
                showToast('Não foi possível renomear o quadro.');
                restore();
            }
        };

        input.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                await finish(true);
            } else if (event.key === 'Escape') {
                event.preventDefault();
                finish(false);
            }
        });

        input.addEventListener('blur', () => finish(true), { once: true });

        requestAnimationFrame(() => {
            input.focus();
            input.select();
        });
    }

    formCreateBoard?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const name = (data.get('name') || '').toString().trim();
        const description = (data.get('description') || '').toString().trim();
        if (!name) {
            showToast('Informe o nome do quadro.');
            return;
        }
        try {
            const payloadDescription = description ? `${description} • Responsável: gguilhem` : 'Responsável: gguilhem';
            const board = await fetchJSON(boardsEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description: payloadDescription }),
            });
            setCurrentBoard(board);
            await loadBoardDetail(board.id);
            closeModal(modalCreateBoard);
            showToast('Quadro criado com sucesso.');
        } catch (error) {
            console.error(error);
            showToast('Não foi possível criar o quadro.');
        }
    });

    formCreateGroup?.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!currentBoard) {
            showToast('Selecione um quadro primeiro.');
            return;
        }
        const data = new FormData(event.currentTarget);
        const name = (data.get('name') || '').toString().trim();
        if (!name) {
            showToast('Informe o nome da tabela.');
            return;
        }
        try {
            const board = await fetchJSON(`${boardsEndpoint}/${currentBoard.id}/groups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            const latestGroup = board.groups?.slice().sort((a, b) => b.position - a.position)[0] || board.groups?.slice().sort((a, b) => b.id - a.id)[0];
            recentlyAddedGroupId = latestGroup?.id ?? null;
            setCurrentBoard(board);
            recentlyAddedGroupId = latestGroup?.id ?? null;
            await loadBoardDetail(board.id);
            closeModal(modalCreateGroup);
            showToast('Tabela criada com sucesso.');
        } catch (error) {
            console.error(error);
            showToast('Não foi possível criar a tabela.');
        }
    });

    formManageColumn?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const boardId = Number(data.get('board_id'));
        const columnId = columnModalMode === 'edit' ? Number(data.get('column_id')) : null;
        const name = (data.get('name') || '').toString().trim();
        const columnType = data.get('column_type');
        if (!name) {
            showToast('Informe o nome da coluna.');
            return;
        }

        let config = null;
        if (columnType === 'status' || columnType === 'label') {
            const labels = collectLabelData();
            if (!labels.length) {
                showToast('Adicione ao menos uma etiqueta.');
                return;
            }
            config = { labels };
        }

        try {
            if (columnModalMode === 'create') {
                const board = await fetchJSON(`${boardsEndpoint}/${boardId}/columns`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, column_type: columnType, config }),
                });
                const latestColumn = board.columns?.slice().sort((a, b) => b.position - a.position)[0] || board.columns?.slice().sort((a, b) => b.id - a.id)[0];
                recentlyAddedColumnId = latestColumn?.id ?? null;
                setCurrentBoard(board);
                recentlyAddedColumnId = latestColumn?.id ?? null;
                await loadBoardDetail(board.id);
                showToast('Coluna criada com sucesso.');
            } else if (columnId) {
                const board = await fetchJSON(`${boardsEndpoint.replace('/boards', '/columns')}/${columnId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, column_type: columnType, config }),
                });
                setCurrentBoard(board);
                recentlyAddedColumnId = columnId;
                await loadBoardDetail(board.id);
                showToast('Coluna atualizada.');
            }
            closeModal(modalManageColumn);
            refreshObservationSidebar();
        } catch (error) {
            console.error(error);
            showToast('Não foi possível salvar a coluna.');
        }
    });

    columnTypeSelect?.addEventListener('change', (event) => {
        const type = event.target.value;
        renderColumnLabels(type, type === 'status' ? DEFAULT_STATUS_LABELS : []);
    });

    function startInlineColumnRename(columnId) {
        const column = getColumnById(currentBoard, columnId);
        if (!column) {
            showToast('Coluna não encontrada.');
            return;
        }

        const header = boardListEl.querySelector(`.sunday-column-header[data-column-id="${columnId}"]`);
        if (!header) {
            openColumnModal('edit', { columnId });
            return;
        }

        const existingEditor = header.querySelector('.sunday-inline-editor');
        if (existingEditor) {
            return;
        }

        const titleButton = header.querySelector('.sunday-column-header__title span');
        const initialName = column.name;
        const editor = document.createElement('div');
        editor.className = 'sunday-inline-editor sunday-inline-editor--column';
        // Abrir editor com input vazio; usar nome atual como placeholder
        editor.innerHTML = `<input type="text" value="" placeholder="${initialName?.replaceAll('"','&quot;') || ''}">`;
        header.appendChild(editor);
        header.classList.add('is-editing');

        const input = editor.querySelector('input');
        input.focus();

        const finish = async (save) => {
            if (!save) {
                editor.remove();
                header.classList.remove('is-editing');
                return;
            }
            const newName = input.value.trim();
            if (!newName || newName === column.name) {
                editor.remove();
                header.classList.remove('is-editing');
                return;
            }
            try {
                const board = await fetchJSON(`${boardsEndpoint.replace('/boards', '/columns')}/${columnId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newName }),
                });
                recentlyAddedColumnId = columnId;
                await loadBoardDetail(board.id);
            } catch (error) {
                console.error(error);
                showToast('Não foi possível renomear a coluna.');
            } finally {
                editor.remove();
                header.classList.remove('is-editing');
            }
        };

        input.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                await finish(true);
            } else if (event.key === 'Escape') {
                event.preventDefault();
                finish(false);
            }
        });

        input.addEventListener('blur', () => finish(true), { once: true });
    }

    function openColumnCustomizeModal(columnId) {
        if (!currentBoard) {
            showToast('Selecione um quadro primeiro.');
            return;
        }
        const column = getColumnById(currentBoard, columnId);
        if (!column) {
            showToast('Coluna não encontrada.');
            return;
        }

        columnModalMode = 'edit';
        columnModalColumnId = columnId;
        columnBoardIdInput.value = String(currentBoard.id);
        columnIdInput.value = String(columnId);

        formManageColumn?.reset();
        if (formManageColumn) {
            const fieldName = formManageColumn.querySelector('[name="name"]');
            if (fieldName) {
                fieldName.value = column.name || '';
            }
        }
        columnTypeSelect.value = column.column_type;

        const labels = column.config?.labels || [];
        renderColumnLabels(column.column_type, labels.length ? labels : (column.column_type === 'status' ? DEFAULT_STATUS_LABELS : []));
        columnSubmitButton.textContent = 'Salvar coluna';
        openModal(modalManageColumn);
    }

    function startInlineItemRename(itemId, cellEl) {
        const context = getItemById(currentBoard, itemId);
        if (!context) {
            showToast('Linha não encontrada.');
            return;
        }
        const { item } = context;
        const input = openInlineEditor(cellEl, item.title || '');
        const boardId = item.board_id;

        const submit = async () => {
            const newTitle = input.value.trim();
            try {
                const board = await fetchJSON(`${boardsEndpoint.replace('/boards', '/items')}/${itemId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: newTitle }),
                });
                currentInlineEditorPreviousNodes = newTitle ? [document.createTextNode(newTitle)] : [];
                recentlyAddedItemId = itemId;
                recentlyAddedGroupId = item.group_id;
                await loadBoardDetail(board.id);
            } catch (error) {
                console.error(error);
                showToast('Não foi possível atualizar a linha.');
            } finally {
                closeInlineEditor();
            }
        };

        input.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                await submit();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                closeInlineEditor();
            }
        });

        input.addEventListener('blur', submit, { once: true });
    }

    formCreateItem?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const boardId = Number(data.get('board_id'));
        const groupId = Number(data.get('group_id'));
        const title = (data.get('title') || '').toString().trim();
        if (!title) {
            showToast('Informe o título da linha.');
            return;
        }
        try {
            const board = await fetchJSON(`${boardsEndpoint}/${boardId}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, group_id: groupId }),
            });
            const latestItem = (board.groups || [])
                .flatMap((group) => group.items || [])
                .sort((a, b) => b.id - a.id)[0];
            recentlyAddedItemId = latestItem?.id ?? null;
            if (latestItem?.group_id) {
                recentlyAddedGroupId = latestItem.group_id;
            }
            closeModal(modalCreateItem);
            setCurrentBoard(board);
            recentlyAddedItemId = latestItem?.id ?? null;
            if (latestItem?.group_id) {
                recentlyAddedGroupId = latestItem.group_id;
            }
            await loadBoardDetail(board.id);
            showToast('Linha adicionada.');
        } catch (error) {
            console.error(error);
            showToast('Não foi possível criar a linha.');
        }
    });

    formObservation?.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!observationState) {
            showToast('Selecione uma célula para registrar observações.');
            return;
        }
        const data = new FormData(event.currentTarget);
        const content = (data.get('content') || '').toString().trim();
        if (!content) {
            showToast('Digite um comentário antes de enviar.');
            return;
        }
        try {
            const comment = await fetchJSON(`${boardsEndpoint.replace('/boards', '/cells')}/${observationState.cellId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, author_id: currentUser.id }),
            });
            enhanceCommentAuthorMetadata(comment);
            const context = getCellById(currentBoard, observationState.cellId);
            if (context) {
                context.cell.comments = context.cell.comments || [];
                context.cell.comments.push(comment);
                renderObservationComments(context.cell);
            }
            formObservation.reset();
            showToast('Comentário registrado.');
        } catch (error) {
            console.error(error);
            showToast('Não foi possível registrar o comentário.');
        }
    });

    async function updateCellValue(cellId, rawValue, columnId = null) {
        try {
            const payload = { raw_value: rawValue };
            if (columnId) {
                const column = getColumnById(currentBoard, columnId);
                if (column && (column.column_type === 'status' || column.column_type === 'label')) {
                    const label = findLabel(column, rawValue || '');
                    payload.color_hex = label?.color || null;
                }
            }
            const cell = await fetchJSON(`${boardsEndpoint.replace('/boards', '/cells')}/${cellId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const context = getCellById(currentBoard, cellId);
            if (context) {
                context.cell.raw_value = cell.raw_value;
                context.cell.color_hex = cell.color_hex;
                context.cell.updated_at = cell.updated_at;
            }
            renderBoard(currentBoard);
            refreshObservationSidebar();
        } catch (error) {
            console.error(error);
            showToast('Não foi possível atualizar a célula.');
        }
    }

    async function archiveBoard(boardId, archived) {
        try {
            await fetchJSON(`${boardsEndpoint}/${boardId}/archive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ archived }),
            });
            removeBoardFromCache(boardId);
            if (!boardsCache.length) {
                setCurrentBoard(null);
                showToast('Quadro ocultado.');
                return;
            }
            const nextBoard = boardsCache[0];
            await loadBoardDetail(nextBoard.id);
            showToast('Quadro ocultado.');
        } catch (error) {
            console.error(error);
            showToast('Não foi possível ocultar o quadro.');
        }
    }

    async function deleteBoard(boardId) {
        const confirmed = await confirmAction({
            title: 'Excluir quadro',
            message: 'Excluir este quadro removerá todas as tabelas e linhas associadas. Deseja continuar?',
            confirmText: 'Excluir',
        });
        if (!confirmed) {
            return;
        }
        try {
            await fetch(`${boardsEndpoint}/${boardId}`, { method: 'DELETE' });
            removeBoardFromCache(boardId);
            if (!boardsCache.length) {
                setCurrentBoard(null);
                showToast('Quadro excluído.');
                return;
            }
            const nextBoard = boardsCache[0];
            await loadBoardDetail(nextBoard.id);
            showToast('Quadro excluído.');
        } catch (error) {
            console.error(error);
            showToast('Não foi possível excluir o quadro.');
        }
    }

    async function confirmDeleteColumn(columnId) {
        if (!columnId) {
            return;
        }
        const confirmed = await confirmAction({
            title: 'Excluir coluna',
            message: 'A exclusão desta coluna removerá permanentemente todos os dados associados. Deseja continuar?',
            confirmText: 'Excluir',
        });
        if (!confirmed) {
            return;
        }
        try {
            const board = await fetchJSON(`${boardsEndpoint.replace('/boards', '/columns')}/${columnId}`, {
                method: 'DELETE',
            });
            setCurrentBoard(board);
            await loadBoardDetail(board.id);
            closeModal(modalManageColumn);
            showToast('Coluna excluída.');
        } catch (error) {
            console.error(error);
            showToast('Não foi possível excluir a coluna.');
        }
    }

    async function duplicateColumn(columnId) {
        const column = getColumnById(currentBoard, columnId);
        if (!column) {
            showToast('Coluna não encontrada.');
            return;
        }
        try {
            const board = await fetchJSON(`${boardsEndpoint}/${currentBoard.id}/columns`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${column.name} (cópia)`,
                    column_type: column.column_type,
                    config: column.config || null,
                }),
            });
            recentlyAddedColumnId = columnId;
            setCurrentBoard(board);
            recentlyAddedColumnId = columnId;
            await loadBoardDetail(board.id);
            showToast('Coluna duplicada.');
        } catch (error) {
            console.error(error);
            showToast('Não foi possível duplicar a coluna.');
        }
    }

    async function addColumnQuick(boardId) {
        if (!boardId) {
            showToast('Selecione um quadro primeiro.');
            return;
        }
        try {
            const board = await fetchJSON(`${boardsEndpoint}/${boardId}/columns`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: '', column_type: 'text' }),
            });
            const latestColumn = board.columns?.slice().sort((a, b) => b.position - a.position)[0] || board.columns?.slice().sort((a, b) => b.id - a.id)[0];
            recentlyAddedColumnId = latestColumn?.id ?? null;
            setCurrentBoard(board);
            recentlyAddedColumnId = latestColumn?.id ?? null;
            await loadBoardDetail(board.id);
            showToast('Coluna criada.');
        } catch (error) {
            console.error(error);
            showToast('Não foi possível criar a coluna.');
        }
    }

    async function addQuickItem(boardId, groupId) {
        try {
            const board = await fetchJSON(`${boardsEndpoint}/${boardId}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: '', group_id: groupId }),
            });
            const latestItem = (board.groups || [])
                .flatMap((group) => group.items || [])
                .sort((a, b) => b.id - a.id)[0];
            recentlyAddedItemId = latestItem?.id ?? null;
            recentlyAddedGroupId = groupId;
            setCurrentBoard(board);
            recentlyAddedItemId = latestItem?.id ?? null;
            recentlyAddedGroupId = groupId;
            await loadBoardDetail(board.id);
            showToast('Linha criada.');
        } catch (error) {
            console.error(error);
            showToast('Não foi possível criar a linha.');
        }
    }

    async function deleteGroup(groupId) {
        if (!groupId) {
            return;
        }
        const confirmed = await confirmAction({
            title: 'Excluir tabela',
            message: 'Remover esta tabela apagará todas as linhas relacionadas. Deseja continuar?',
            confirmText: 'Excluir',
        });
        if (!confirmed) {
            return;
        }
        try {
            const board = await fetchJSON(`${boardsEndpoint.replace('/boards', '/groups')}/${groupId}`, {
                method: 'DELETE',
            });
            setCurrentBoard(board);
            await loadBoardDetail(board.id);
            showToast('Tabela removida.');
        } catch (error) {
            console.error(error);
            showToast('Não foi possível remover a tabela.');
        }
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeModal(modalCreateBoard);
            closeModal(modalCreateGroup);
            closeModal(modalManageColumn);
            closeModal(modalCreateItem);
            closeLabelPicker();
            closeInlineEditor();
            closeBoardMenu();
            closeColumnMenu();
            closeGroupMenu();
            if (observationSidebar?.classList.contains('is-open')) {
                closeObservationSidebar();
            }
        }
    });

    observationSidebar?.querySelector('[data-action="close-observation"]')?.addEventListener('click', closeObservationSidebar);

    function startInlineGroupRename(groupId) {
        const group = currentBoard?.groups?.find((g) => g.id === groupId);
        if (!group) {
            showToast('Tabela não encontrada.');
            return;
        }
        const header = boardListEl.querySelector(`.sunday-group[data-group-id="${groupId}"] .sunday-group__header`);
        if (!header) {
            return;
        }
        const titleButton = header.querySelector('.sunday-group__title-button');
        const title = titleButton?.querySelector('strong');
        if (!titleButton || !title) {
            return;
        }

        const existingEditor = header.querySelector('.sunday-inline-editor--group');
        if (existingEditor) {
            return;
        }

        const originalName = group.name || '';
        const createTitleNode = (value) => {
            const strong = document.createElement('strong');
            if (value) {
                strong.textContent = value;
            } else {
                strong.textContent = 'Clique para nomear';
                strong.classList.add('is-placeholder');
            }
            return strong;
        };

        const editor = document.createElement('div');
        editor.className = 'sunday-inline-editor sunday-inline-editor--group';
        editor.innerHTML = `<input type="text" value="${originalName}">`;
        titleButton.replaceChild(editor, title);

        const input = editor.querySelector('input');
        input.focus();
        input.select();

        const restore = (value) => {
            const replacement = createTitleNode(value);
            const parent = editor.parentNode;
            if (parent) {
                parent.insertBefore(replacement, editor);
            }
            editor.remove();
        };

        const finish = async (save) => {
            if (!save) {
                restore(originalName);
                return;
            }
            const newName = input.value.trim();
            if (!newName || newName === originalName) {
                restore(originalName);
                return;
            }
            try {
                const board = await fetchJSON(`${boardsEndpoint.replace('/boards', '/groups')}/${groupId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newName }),
                });
                group.name = newName;
                restore(newName);
                recentlyAddedGroupId = groupId;
                setCurrentBoard(board);
                recentlyAddedGroupId = groupId;
                await loadBoardDetail(board.id);
            } catch (error) {
                console.error(error);
                showToast('Não foi possível renomear a tabela.');
                group.name = originalName;
                restore(originalName);
            }
        };

        input.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                await finish(true);
            } else if (event.key === 'Escape') {
                event.preventDefault();
                finish(false);
            }
        });

        input.addEventListener('blur', () => finish(true), { once: true });
    }

    loadBoards();
});
