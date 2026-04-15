import api from '../api.js';
import auth from '../auth.js';

class Notifications {
    constructor() {
        this.socket = null;
        this.unreadCount = 0;
        this.notifications = [];
    }

    destroy() {
        // Disconnect socket
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        // Remove the notification UI bell from DOM
        const container = document.getElementById('notif-container');
        if (container) container.remove();
        // Reset state
        this.notifications = [];
        this.unreadCount = 0;
    }

    async init() {
        // Never run on public pages — no matter who called init()
        const publicPages = ['/login', '/register', '/'];
        if (publicPages.includes(window.location.pathname)) {
            this.destroy();
            return;
        }

        const token = api.getToken();
        if (!token) return;

        // Disconnect old socket
        if (this.socket) {
            this.socket.disconnect();
        }

        // Load previous notifications
        try {
            const data = await api.getNotifications();

            this.notifications = data.map(n => ({
                id: n._id,
                icon: n.icon || '🔔',
                message: n.message,
                status: n.status || '',
                time: new Date(n.timestamp),
                read: n.is_read
            }));

            this.unreadCount =
                this.notifications.filter(n => !n.read).length;

        } catch (e) {
            console.error('Error fetching notifications', e);
        }

        // Connect socket
        const url = new URL(
            api.API_URL || 'http://127.0.0.1:5000'
        );

        this.socket = io(
            `http://${url.hostname}:${url.port}`,
            {
                auth: { token }
            }
        );

        this.setupListeners();
        this.renderUI();
    }

    setupListeners() {

        this.socket.on('connect', () => {
            console.log(
                '✅ Connected to real-time notifications server'
            );
        });

        // ================= REQUESTER =================

        this.socket.on(
            'request-updated',
            (data) => {

                const currentUser =
                    JSON.parse(
                        localStorage.getItem("user")
                    );

                const currentUserId =
                    currentUser?._id;

                // Only show for correct requester
                if (
                    data.requesterId &&
                    data.requesterId !== currentUserId
                ) {
                    return;
                }

                this.addNotification({
                    type: 'update',
                    status:
                        data.status === 'APPROVED'
                            ? 'Accepted'
                            : 'Rejected',
                    icon:
                        data.status === 'APPROVED'
                            ? '✅'
                            : '❌',
                    message: data.message,
                    time: new Date(),
                    read: false
                });

                this.showToast(
                    data.status === 'APPROVED'
                        ? 'success'
                        : 'error',
                    data.message
                );
            }
        );

        // ================= APPROVER / ADMIN =================

        this.socket.on(
            'new-request',
            (data) => {

                const user =
                    JSON.parse(
                        localStorage.getItem("user")
                    );

                const role = user?.role;

                // Only approver/admin see this
                if (
                    role !== "APPROVER" &&
                    role !== "ADMIN"
                ) {
                    return;
                }

                this.addNotification({
                    type: 'new',
                    status: 'Pending',
                    icon: '🔔',
                    message: data.message,
                    time: new Date(),
                    read: false
                });

                this.showToast(
                    'warning',
                    `New request pending approval! Risk Level: ${data.riskLevel || 'N/A'}`
                );
            }
        );

    }

    // ================= CORE FUNCTIONS =================

    addNotification(notif) {
        this.notifications.unshift(notif);
        this.unreadCount++;

        this.updateBadge();
        this.renderDropdown();
    }

    renderUI() {

        const navbar =
            document.querySelector('nav')
            || document.body;

        let container =
            document.getElementById(
                'notif-container'
            );

        if (!container) {

            container =
                document.createElement('div');

            container.id =
                'notif-container';

            container.className =
                'notif-container';

            const navLinks =
                navbar.querySelector(
                    '.nav-links'
                ) || navbar;

            if (
                navLinks.querySelector(
                    '#logoutBtn'
                )
            ) {
                navLinks.insertBefore(
                    container,
                    document.getElementById(
                        'logoutBtn'
                    )
                );
            } else {
                navbar.appendChild(
                    container
                );
            }
        }

        container.innerHTML = `
        <button id="notifBtn" class="notif-btn">
            🔔
            <span id="notifBadge"
                class="notif-count"
                style="display:none;">
                0
            </span>
        </button>

        <div id="notifDropdown"
             class="notif-dropdown hidden">

            <div class="notif-header">
                <span>Notifications</span>

                <button
                    class="notif-clear"
                    id="notifClear">

                    Clear All
                </button>
            </div>

            <div id="notifList"
                 class="notif-list">

                <div class="notif-empty">
                    No notifications yet
                </div>

            </div>

        </div>
        `;

        document
            .getElementById('notifBtn')
            .addEventListener(
                'click',
                async (e) => {

                    e.stopPropagation();

                    const dropdown =
                        document.getElementById(
                            'notifDropdown'
                        );

                    dropdown.classList.toggle(
                        'hidden'
                    );

                    if (
                        !dropdown.classList.contains(
                            'hidden'
                        )
                    ) {
                        if (
                            this.unreadCount > 0
                        ) {

                            this.unreadCount = 0;

                            this.notifications
                                .forEach(
                                    n => n.read = true
                                );

                            this.updateBadge();
                            this.renderDropdown();

                            try {
                                await api.markNotificationsRead();
                            } catch { }
                        }
                    }
                }
            );

        document
            .getElementById('notifClear')
            .addEventListener(
                'click',
                async () => {

                    this.notifications = [];
                    this.unreadCount = 0;

                    this.updateBadge();
                    this.renderDropdown();

                    try {
                        await api.clearNotifications();
                    } catch { }
                }
            );

        document.addEventListener(
            'click',
            (e) => {

                const dropdown =
                    document.getElementById(
                        'notifDropdown'
                    );

                if (
                    dropdown &&
                    !dropdown.classList.contains(
                        'hidden'
                    ) &&
                    !e.target.closest(
                        '#notif-container'
                    )
                ) {
                    dropdown.classList.add(
                        'hidden'
                    );
                }
            }
        );

        this.renderDropdown();
    }

    updateBadge() {

        const badge =
            document.getElementById(
                'notifBadge'
            );

        if (badge) {

            badge.innerText =
                this.unreadCount > 9
                    ? '9+'
                    : this.unreadCount;

            badge.style.display =
                this.unreadCount > 0
                    ? 'flex'
                    : 'none';
        }
    }

    renderDropdown() {

        const list =
            document.getElementById(
                'notifList'
            );

        if (!list) return;

        if (
            this.notifications.length === 0
        ) {
            list.innerHTML =
                '<div class="notif-empty">No new notifications</div>';
            return;
        }

        list.innerHTML =
            this.notifications
                .map(
                    (n, i) => `
            <div class="notif-item
                ${i < this.unreadCount
                            ? 'unread'
                            : ''}">

                <div class="notif-icon">
                    ${n.icon}
                </div>

                <div>

                    <div>
                        ${n.message}
                    </div>

                    <div class="notif-time">
                        ${n.time.toLocaleTimeString(
                                [],
                                {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }
                            )}
                    </div>

                </div>

            </div>
        `
                )
                .join('');
    }

    showToast(type, message) {

        let container =
            document.getElementById(
                'toast-container'
            );

        if (!container) {

            container =
                document.createElement(
                    'div'
                );

            container.id =
                'toast-container';

            container.className =
                'notif-toast';

            document.body.appendChild(
                container
            );
        }

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️'
        };

        const toast =
            document.createElement(
                'div'
            );

        toast.className =
            `toast ${type}`;

        toast.innerHTML =
            `<span>${icons[type]}</span>
             <div>${message}</div>`;

        container.appendChild(
            toast
        );

        setTimeout(() => {

            toast.style.opacity = '0';
            toast.style.transform =
                'translateY(20px)';

            setTimeout(
                () => toast.remove(),
                400
            );

        }, 4000);
    }

}

export default new Notifications();