const FixedSizeBufferQueue = (length, initialValue) => {
    if (length <= 0) throw new Error('Length must be greater zero');
    const fixedSizeQueue = new Array(length).fill(initialValue);
    let insertCount = 0;
    fixedSizeQueue.push = function () {
        insertCount += (insertCount < length);
        this.shift();
        return Array.prototype.push.apply(this, arguments);
    };
    return fixedSizeQueue;
};

export default FixedSizeBufferQueue;