"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentPin = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const CommentPin = ({ thread, isActive, onClick, style = {} }) => {
    const commentCount = thread.comments.length;
    const isResolved = thread.status === 'resolved';
    const authorInitials = thread.comments[0]?.author.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD';
    const pinStyle = {
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        ...style
    };
    if (isResolved) {
        return ((0, jsx_runtime_1.jsxs)("div", { style: {
                ...pinStyle,
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#1bc47d',
                border: '2px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isActive ? '0 0 12px rgba(0, 122, 255, 0.6)' : '0 2px 8px rgba(0, 0, 0, 0.2)',
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                position: 'relative'
            }, onClick: onClick, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }, children: authorInitials }), (0, jsx_runtime_1.jsx)("div", { style: {
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-2px',
                        backgroundColor: '#1bc47d',
                        borderRadius: '50%',
                        width: '14px',
                        height: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid white'
                    }, children: (0, jsx_runtime_1.jsx)("svg", { width: "8", height: "8", fill: "white", viewBox: "0 0 20 20", children: (0, jsx_runtime_1.jsx)("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }) })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { style: {
            ...pinStyle,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: thread.comments[0]?.author.color || '#ff6b6b',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: isActive ? '0 0 12px rgba(0, 122, 255, 0.6)' : '0 2px 8px rgba(0, 0, 0, 0.2)',
            transform: isActive ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
        }, onClick: onClick, children: [authorInitials, commentCount > 1 && ((0, jsx_runtime_1.jsx)("div", { style: {
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#ff4444',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    border: '1px solid white'
                }, children: commentCount }))] }));
};
exports.CommentPin = CommentPin;
//# sourceMappingURL=CommentPin.js.map