export class FileChunker {
    _chunkSize: number;
    _maxPartitionSize: number;
    _offset: number;
    _partitionSize: number;
    _file: any;
    _onChunk: any;
    _onPartitionEnd: any;
    _reader: FileReader;
  
    constructor(file: any, onChunk: any, onPartitionEnd: any) {
        this._chunkSize = 64000; // 64 KB
        this._maxPartitionSize = 1e6; // 1 MB
        this._offset = 0;
        this._partitionSize = 0;
        this._file = file;
        this._onChunk = onChunk;
        this._onPartitionEnd = onPartitionEnd;
        this._reader = new FileReader();
        this._reader.addEventListener('load', e => this._onChunkRead(e.target.result));
    }
  
    nextPartition() {
        this._partitionSize = 0;
        this._readChunk();
    }
  
    _readChunk() {
        const chunk = this._file.slice(this._offset, this._offset + this._chunkSize);
        this._reader.readAsArrayBuffer(chunk);
    }
  
    _onChunkRead(chunk: any) {
        this._offset += chunk.byteLength;
        this._partitionSize += chunk.byteLength;
        this._onChunk(chunk);
        if (this._isPartitionEnd() || this.isFileEnd()) {
            this._onPartitionEnd(this._offset);
            return;
        }
        this._readChunk();
    }
  
    repeatPartition() {
        this._offset -= this._partitionSize;
        this._nextPartition();
    }
    _nextPartition() {
      throw new Error('Method not implemented.');
    }
  
    _isPartitionEnd() {
        return this._partitionSize >= this._maxPartitionSize;
    }
  
    isFileEnd() {
        return this._offset >= this._file.size;
    }
  
    get progress() {
        return this._offset / this._file.size;
    }
  }