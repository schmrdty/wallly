// Global polyfills for server-side rendering
// Guard against multiple initializations
if (typeof globalThis !== 'undefined' && !(globalThis as any).__POLYFILLS_INITIALIZED__) {
    (globalThis as any).__POLYFILLS_INITIALIZED__ = true;

    // Mock addEventListener globally for libraries that access it directly
    if (typeof globalThis.addEventListener === 'undefined') {
        globalThis.addEventListener = () => { };
        globalThis.removeEventListener = () => { };
        globalThis.dispatchEvent = () => false;
    }

    // Mock IndexedDB for SSR
    if (typeof globalThis.indexedDB === 'undefined') {
        globalThis.indexedDB = {
            open: () => ({
                onsuccess: null,
                onerror: null,
                onupgradeneeded: null,
                result: null,
                error: null,
                readyState: 'done',
                transaction: null,
                addEventListener: () => { },
                removeEventListener: () => { },
                dispatchEvent: () => false,
            }),
            deleteDatabase: () => ({
                onsuccess: null,
                onerror: null,
                onblocked: null,
                onupgradeneeded: null,
            }),
            databases: () => Promise.resolve([]),
            cmp: () => 0,
        } as any;
    }

    if (typeof globalThis.IDBKeyRange === 'undefined') {
        globalThis.IDBKeyRange = {
            bound: () => ({}),
            only: () => ({}),
            lowerBound: () => ({}),
            upperBound: () => ({}),
        } as any;
    }

    // Mock other browser APIs that might be accessed during SSR
    if (typeof globalThis.localStorage === 'undefined') {
        globalThis.localStorage = {
            getItem: () => null,
            setItem: () => { },
            removeItem: () => { },
            clear: () => { },
            key: () => null,
            length: 0,
        };
    }

    if (typeof globalThis.sessionStorage === 'undefined') {
        globalThis.sessionStorage = {
            getItem: () => null,
            setItem: () => { },
            removeItem: () => { },
            clear: () => { },
            key: () => null,
            length: 0,
        };
    }    // Mock window object properties
    if (typeof globalThis.window === 'undefined') {
        globalThis.window = {
            addEventListener: () => { },
            removeEventListener: () => { },
            dispatchEvent: () => false,
            location: {
                href: 'http://localhost:3000',
                origin: 'http://localhost:3000',
                protocol: 'http:',
                host: 'localhost:3000',
                hostname: 'localhost',
                port: '3000',
                pathname: '/',
                search: '',
                hash: '',
                reload: () => { },
                replace: () => { },
                assign: () => { },
            },
            navigator: {
                userAgent: 'Node.js',
                language: 'en-US',
                languages: ['en-US'],
                platform: 'Node.js',
                onLine: true,
            },
            innerWidth: 1024,
            innerHeight: 768,
            outerWidth: 1024,
            outerHeight: 768,
            screen: {
                width: 1024,
                height: 768,
                availWidth: 1024,
                availHeight: 768,
            },
            history: {
                pushState: () => { },
                replaceState: () => { },
                back: () => { },
                forward: () => { },
                go: () => { },
                length: 1,
                state: null,
            },
            getComputedStyle: () => ({
                getPropertyValue: () => '',
                setProperty: () => { },
            }),
            matchMedia: () => ({
                matches: false,
                media: '',
                onchange: null,
                addListener: () => { },
                removeListener: () => { },
                addEventListener: () => { },
                removeEventListener: () => { },
                dispatchEvent: () => false,
            }),
            requestAnimationFrame: (callback: any) => setTimeout(callback, 16),
            cancelAnimationFrame: (id: any) => clearTimeout(id),
            setTimeout: globalThis.setTimeout,
            clearTimeout: globalThis.clearTimeout,
            setInterval: globalThis.setInterval,
            clearInterval: globalThis.clearInterval,
            console: globalThis.console,
            alert: () => { },
            confirm: () => true,
            prompt: () => null,
            open: () => null,
            close: () => { },
            postMessage: () => { },
            focus: () => { },
            blur: () => { },
            scroll: () => { },
            scrollTo: () => { },
            scrollBy: () => { },
            resizeTo: () => { },
            resizeBy: () => { },
            moveTo: () => { },
            moveBy: () => { },
        } as any;
    }

    if (typeof globalThis.document === 'undefined') {
        globalThis.document = {
            createElement: () => ({
                setAttribute: () => { },
                getAttribute: () => null,
                style: {},
                addEventListener: () => { },
                removeEventListener: () => { },
            }),
            createTreeWalker: () => ({
                nextNode: () => null,
                previousNode: () => null,
                firstChild: () => null,
                lastChild: () => null,
                parentNode: () => null,
                previousSibling: () => null,
                nextSibling: () => null,
                root: null,
                whatToShow: 0,
                filter: null,
                currentNode: null,
            }),
            createRange: () => ({
                setStart: () => { },
                setEnd: () => { },
                collapse: () => { },
                selectNode: () => { },
                selectNodeContents: () => { },
                deleteContents: () => { },
                extractContents: () => null,
                cloneContents: () => null,
                insertNode: () => { },
                surroundContents: () => { },
                cloneRange: () => ({}),
                detach: () => { },
                toString: () => '',
                compareBoundaryPoints: () => 0,
                commonAncestorContainer: null,
                startContainer: null,
                endContainer: null,
                startOffset: 0,
                endOffset: 0,
                collapsed: true,
            }),
            addEventListener: () => { },
            removeEventListener: () => { },
            querySelector: () => null,
            querySelectorAll: () => [],
            getElementById: () => null,
            getElementsByTagName: () => [],
            body: {
                style: {},
                appendChild: () => { },
                removeChild: () => { },
                addEventListener: () => { },
                removeEventListener: () => { },
            },
            head: {
                style: {},
                appendChild: () => { },
                removeChild: () => { },
                addEventListener: () => { },
                removeEventListener: () => { },
            },
            defaultView: null,
            nodeType: 9,
            nodeName: '#document',
            textContent: null,
        } as any;
    }

    // Mock navigator for SSR
    if (typeof globalThis.navigator === 'undefined') {
        globalThis.navigator = {
            userAgent: 'Node.js',
            language: 'en-US',
            languages: ['en-US'],
            platform: 'Node.js',
            onLine: true,
        } as any;
    }

    // Mock location for SSR
    if (typeof globalThis.location === 'undefined') {
        globalThis.location = {
            href: 'http://localhost:3000',
            origin: 'http://localhost:3000',
            protocol: 'http:',
            host: 'localhost:3000',
            hostname: 'localhost',
            port: '3000',
            pathname: '/',
            search: '',
            hash: '',
            reload: () => { },
            replace: () => { },
            assign: () => { },
        } as any;
    }

    // Mock crypto for SSR (basic implementation)
    if (typeof globalThis.crypto === 'undefined') {
        globalThis.crypto = {
            getRandomValues: (arr: any) => {
                for (let i = 0; i < arr.length; i++) {
                    arr[i] = Math.floor(Math.random() * 256);
                }
                return arr;
            },
            randomUUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            }), subtle: {} as any,
        } as any;
    }

    // Mock additional Web APIs that wallet libraries might need
    if (typeof globalThis.fetch === 'undefined') {
        globalThis.fetch = () => Promise.reject(new Error('Fetch not available in SSR'));
    }

    if (typeof globalThis.WebSocket === 'undefined') {
        globalThis.WebSocket = class WebSocket {
            constructor() { }
            close() { }
            send() { }
            addEventListener() { }
            removeEventListener() { }
        } as any;
    }

    if (typeof globalThis.CustomEvent === 'undefined') {
        globalThis.CustomEvent = class CustomEvent {
            constructor(type: string, options?: any) {
                this.type = type;
                this.detail = options?.detail;
            }
            type: string;
            detail: any;
        } as any;
    }

    if (typeof globalThis.Event === 'undefined') {
        globalThis.Event = class Event {
            constructor(type: string, options?: any) {
                this.type = type;
            }
            type: string;
            preventDefault() { }
            stopPropagation() { }
            stopImmediatePropagation() { }
        } as any;
    } if (typeof globalThis.EventTarget === 'undefined') {
        globalThis.EventTarget = class EventTarget {
            addEventListener() { }
            removeEventListener() { }
            dispatchEvent() { return false; }
        } as any;
    }

    // Client-side console warning suppressions
    if (typeof window !== 'undefined') {
        // Suppress Lit dev mode warning
        (window as any)['lit-dev-mode'] = false;

        // Suppress specific console warnings
        const originalWarn = console.warn;
        console.warn = (...args: any[]) => {
            const message = args.join(' ');

            // Suppress specific warnings that are non-critical
            const suppressedWarnings = [
                'Incompatible',
                'fetch-home-phone-colors',
                'A form field element',
                'viewport',
                'Content-Type',
                'viewport meta element',
                'maximum-scale',
                'This browser does not support',
                'not supported by Firefox'
            ];

            const shouldSuppress = suppressedWarnings.some(warning =>
                message.toLowerCase().includes(warning.toLowerCase())
            );

            if (!shouldSuppress) {
                originalWarn.apply(console, args);
            }
        };

        // Global error handler for unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            // Log the error but don't show it to users for network/auth errors
            const reason = event.reason;
            if (reason?.message?.includes('401') || reason?.message?.includes('Network Error')) {
                console.warn('Handled auth/network error:', reason?.message);
                event.preventDefault();
            }
        });
    }
}

export { };
