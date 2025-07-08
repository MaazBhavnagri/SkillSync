// components/NotificationModal.jsx
"use client";
import React from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger,
} from "./animated-modal";

export function NotificationModal({ show, onClose, title, description }) {
  if (!show) return null;

  return (
    <Modal open={show} onOpenChange={onClose}>
  {/* <ModalBody> */}
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-2xl p-6 transition-all duration-300 scale-100">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
        >
          ×
        </button>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-2">
          {title}
        </h2>

        {/* Description */}
        <p className="text-center text-gray-600 dark:text-gray-300 text-base">
          {description}
        </p>

        {/* Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg text-sm font-medium shadow-md"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  {/* </ModalBody> */}
</Modal>



  );
}
