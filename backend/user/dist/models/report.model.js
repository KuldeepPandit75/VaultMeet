"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const reportSchema = new mongoose_1.Schema({
    reporterId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    roomId: {
        type: String,
        required: false,
    },
    eventId: {
        type: String,
        required: false,
    },
    type: {
        type: String,
        enum: ['bug', 'feature', 'feedback', 'abuse', 'technical'],
        required: true,
    },
    category: {
        type: String,
        enum: ['game', 'whiteboard', 'chat', 'video', 'audio', 'general', 'other'],
        required: true,
    },
    title: {
        type: String,
        required: true,
        maxlength: 200,
    },
    description: {
        type: String,
        required: true,
        maxlength: 2000,
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
    },
    attachments: [{
            type: String,
        }],
    userAgent: {
        type: String,
    },
    browserInfo: {
        type: String,
    },
    deviceInfo: {
        type: String,
    },
    resolvedAt: {
        type: Date,
    },
    resolvedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    resolution: {
        type: String,
        maxlength: 1000,
    },
    tags: [{
            type: String,
        }],
}, {
    timestamps: true,
});
// Index for better query performance
reportSchema.index({ reporterId: 1, createdAt: -1 });
reportSchema.index({ status: 1, priority: 1 });
reportSchema.index({ type: 1, category: 1 });
const Report = mongoose_1.default.model('Report', reportSchema);
exports.default = Report;
