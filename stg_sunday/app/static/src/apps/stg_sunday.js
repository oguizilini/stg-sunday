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
    const confirmModal = document.getElementById('modal-confirm');
    const confirmTitleEl = confirmModal?.querySelector('[data-confirm-title]');
    const confirmMessageEl = confirmModal?.querySelector('[data-confirm-message]');
    const confirmCancelBtn = confirmModal?.querySelector('[data-confirm-cancel]');
    const confirmOkBtn = confirmModal?.querySelector('[data-confirm-ok]');
    const logoImg = wrapper.querySelector('.sunday-logo img');

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
    let sharedSyncingFromTable = false;
    let sharedSyncingFromBar = false;

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
        const card = wrapper.querySelector('.content-card');
        (card || wrapper).appendChild(sharedScrollbar);
    }

    function cleanupTableScrollers() {
        tableScrollCleanups.forEach((cleanup) => cleanup());
        tableScrollCleanups = [];
        sharedActiveTable = null;
        sharedActiveViewport = null;
        sharedSyncingFromTable = false;
        sharedSyncingFromBar = false;
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

    function syncSharedFromTable() {
        if (!sharedScrollbar || !sharedActiveTable || sharedSyncingFromBar) {
            return;
        }
        sharedSyncingFromTable = true;
        sharedScrollbar.scrollLeft = sharedActiveTable.scrollLeft;
        requestAnimationFrame(() => {
            sharedSyncingFromTable = false;
        });
    }

    function handleSharedScrollbarScroll() {
        if (!sharedActiveTable || sharedSyncingFromTable) {
            return;
        }
        sharedSyncingFromBar = true;
        sharedActiveTable.scrollLeft = sharedScrollbar.scrollLeft;
        requestAnimationFrame(() => {
            sharedSyncingFromBar = false;
        });
    }

    function registerSharedScrollbar(tableEl, viewportEl) {
        ensureSharedScrollbar();

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

        tableScrollCleanups.push(() => resizeObserver.disconnect());
        tableScrollCleanups.push(() => tableEl.removeEventListener('scroll', onTableScroll));
        tableScrollCleanups.push(() => tableEl.removeEventListener('pointerenter', onPointerEnter));
        tableScrollCleanups.push(() => tableEl.removeEventListener('focusin', onFocusIn));

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
        if (board !== currentBoard) {
            closeObservationSidebar();
        }
        closeBoardMenu();
        closeColumnMenu();
        closeLabelPicker();
        closeInlineEditor();

        currentBoard = board;
        activeBoardId = board?.id ?? null;
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
            const groupEl = buildGroupElement(board, group, columns);
            boardListEl.appendChild(groupEl);

            if (group.id === recentlyAddedGroupId) {
                groupEl.classList.add('is-recent');
                setTimeout(() => groupEl.classList.remove('is-recent'), 1600);
                setTimeout(() => groupEl.scrollIntoView({ behavior: 'smooth', block: 'center' }), 240);
            }

            if (recentlyAddedItemId) {
                const newRow = groupEl.querySelector(`.sunday-table__row[data-item-id="${recentlyAddedItemId}"]`);
                if (newRow) {
                    newRow.classList.add('is-recent');
                    setTimeout(() => newRow.classList.remove('is-recent'), 1600);
                    setTimeout(() => newRow.scrollIntoView({ behavior: 'smooth', block: 'center' }), 260);
                }
            }
        });

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

    function getGridTemplate(columnCount) {
        const count = Math.max(Number(columnCount) || 0, 0);
        const parts = ['240px'];
        if (count > 0) {
            parts.push(`repeat(${count}, minmax(220px, 280px))`);
        }
        parts.push('64px');
        return parts.join(' ');
    }

    function buildGroupElement(board, group, columns) {
        const groupEl = document.createElement('article');
        groupEl.className = 'sunday-group';
        groupEl.dataset.groupId = group.id;
        const accentColor = group.color_hex || '#4361EE';
        groupEl.style.setProperty('--sunday-group-accent', accentColor);

        const gridTemplate = getGridTemplate(columns.length);

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

        const titleHeader = document.createElement('span');
        titleHeader.textContent = 'Item';
        head.appendChild(titleHeader);

        columns.forEach((column) => {
            const span = document.createElement('span');
            const headerWrapper = document.createElement('div');
            headerWrapper.className = 'sunday-column-header';
            headerWrapper.dataset.columnId = column.id;

            const titleBtn = document.createElement('button');
            titleBtn.type = 'button';
            titleBtn.className = 'sunday-column-header__title';
            titleBtn.dataset.action = 'rename-column';
            titleBtn.dataset.columnId = column.id;

            const titleSpan = document.createElement('span');
            titleSpan.className = 'sunday-column-title';
            if (column.name) {
                titleSpan.textContent = column.name;
            } else {
                titleSpan.textContent = 'Clique para nomear';
                titleSpan.classList.add('is-placeholder');
            }

            titleBtn.appendChild(titleSpan);

            const headerActions = document.createElement('div');
            headerActions.className = 'sunday-column-header__actions';

            const menuBtn = document.createElement('button');
            menuBtn.type = 'button';
            menuBtn.dataset.action = 'column-menu';
            menuBtn.dataset.columnId = column.id;
            menuBtn.title = 'Opções da coluna';
            menuBtn.innerHTML = ICON_MORE;

            headerActions.appendChild(menuBtn);

            headerWrapper.append(titleBtn, headerActions);
            span.appendChild(headerWrapper);
            head.appendChild(span);
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
                row.style.gridTemplateColumns = gridTemplate;

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

                columns.forEach((column) => {
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
                        const labelOption = findLabel(column, cellData.raw_value || '');
                        if (labelOption) {
                            const chip = document.createElement('span');
                            chip.className = 'sunday-label-chip';
                            chip.textContent = labelOption.text;
                            chip.style.background = labelOption.color || '#4361EE';
                            chip.title = labelOption.text;
                            cell.appendChild(chip);
                            cell.title = labelOption.text;
                        } else if (cellData.raw_value) {
                            cell.textContent = cellData.raw_value;
                            cell.title = cellData.raw_value;
                        } else {
                            cell.classList.add('is-empty');
                            cell.innerHTML = '<span class="sunday-cell-placeholder">Selecionar status</span>';
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
            const leadingCell = document.createElement('div');
            leadingCell.className = 'sunday-cell sunday-cell--item';
            leadingCell.setAttribute('aria-hidden', 'true');
            shortcutRow.appendChild(leadingCell);

            columns.forEach(() => {
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
        return groupEl;
    }

    function formatCellValue(type, rawValue) {
        if (!rawValue) {
            return '';
        }
        if (type === 'date') {
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
        observationTitle.textContent = `Observações - ${item?.title || ''}`;
        observationSubtitle.textContent = `Registradas em ${new Date().toLocaleDateString('pt-BR')}`;
        renderObservationComments(cell);
    }

    function closeObservationSidebar() {
        observationSidebar?.classList.remove('is-open');
        observationSidebar?.setAttribute('aria-hidden', 'true');
        observationState = null;
        formObservation?.reset();
    }

    function renderObservationComments(cell) {
        if (!observationComments) {
            return;
        }
        observationComments.innerHTML = '';
        const comments = cell?.comments || [];
        if (!comments.length) {
            const empty = document.createElement('div');
            empty.className = 'sunday-comment';
            empty.innerHTML = '<div class="sunday-comment__meta">Nenhum comentário registrado.</div><p>Use o formulário abaixo para adicionar o primeiro registro.</p>';
            observationComments.appendChild(empty);
            return;
        }
        comments.forEach((comment) => {
            const commentEl = document.createElement('div');
            commentEl.className = 'sunday-comment';
            const createdAt = new Date(comment.created_at).toLocaleString('pt-BR');
            commentEl.innerHTML = `
                <div class="sunday-comment__meta">Autor: ${comment.author_id || 'Usuário'} · ${createdAt}</div>
                <p>${comment.content}</p>
            `;
            observationComments.appendChild(commentEl);
        });
    }

    function refreshObservationSidebar() {
        if (!observationState) {
            return;
        }
        const { cell } = getCellById(currentBoard, observationState.cellId) || {};
        if (cell) {
            renderObservationComments(cell);
            const button = boardListEl.querySelector(`button[data-cell-id="${cell.id}"] span`);
            if (button) {
                button.textContent = String(cell.comments?.length || 0);
            }
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
            if (!cellEl.contains(event.target)) {
                closeInlineEditor();
            }
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
        const input = openInlineEditor(cellEl, cellData.raw_value || '', 'date');
        let handled = false;
        const commit = async () => {
            if (handled) {
                return;
            }
            handled = true;
            await updateCellValue(cellData.id, input.value || null);
            const displayValue = formatCellValue('date', input.value || null);
            currentInlineEditorPreviousNodes = displayValue ? [document.createTextNode(displayValue)] : [];
            closeInlineEditor();
        };
        input.addEventListener('change', commit);
        input.addEventListener('blur', commit, { once: true });
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeInlineEditor();
            }
        });
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
        editor.innerHTML = `<input type="text" value="${initialName}">`;
        header.appendChild(editor);

        const input = editor.querySelector('input');
        input.focus();
        input.select();

        const finish = async (save) => {
            if (!save) {
                editor.remove();
                return;
            }
            const newName = input.value.trim();
            if (!newName || newName === column.name) {
                editor.remove();
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
                body: JSON.stringify({ content }),
            });
            const context = getCellById(currentBoard, observationState.cellId);
            if (context) {
                context.cell.comments = context.cell.comments || [];
                context.cell.comments.push(comment);
                renderObservationComments(context.cell);
                const button = boardListEl.querySelector(`button[data-cell-id="${context.cell.id}"] span`);
                if (button) {
                    button.textContent = String(context.cell.comments.length);
                }
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
