  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } rounded-2xl p-6 max-w-md w-full relative`}
    >
      <button
        onClick={onClose}
        className={`absolute top-2 right-2 p-2 rounded-lg ${
          theme === 'dark'
            ? 'hover:bg-gray-700'
            : 'hover:bg-gray-100'
        } transition-colors`}
      >
        <X className="w-5 h-5" />
      </button>
    </motion.div>
  </div> 