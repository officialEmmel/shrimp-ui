export class FileDigester {
    _buffer: any[];
    _bytesReceived: number;
    _size: any;
    _mime: string;
    _name: any;
    _callback: any;
    progress: number | undefined;
    _id: any;
  
    constructor(meta: { size: any; mime: string; name: any; id:any}, callback: any) {
        this._buffer = [];
        this._bytesReceived = 0;
        this._size = meta.size;
        this._mime = meta.mime || 'application/octet-stream';
        this._name = meta.name;
        this._id = meta.id;
        this._callback = callback;
    }
  
    unchunk(chunk: any) {
        this._buffer.push(chunk);
        this._bytesReceived += chunk.byteLength || chunk.size;
        const totalChunks = this._buffer.length;
        this.progress = this._bytesReceived / this._size;
        if (isNaN(this.progress)) this.progress = 1
  
        if (this._bytesReceived < this._size) return;
        // we are done
        let blob = new Blob(this._buffer, { type: this._mime });
        this._callback({
            name: this._name,
            mime: this._mime,
            size: this._size,
            id: this._id,
            blob: blob
        });
    }
  
  }
  