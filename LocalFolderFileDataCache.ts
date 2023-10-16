import { FileNameBox } from "./FileNameBox";
import { FolderPathBox } from "./FolderPathBox";
import { LocalFileSystem } from "./LocalFileSystem";
import { OnException } from "away-core/OnException";

/** Allows you to cache data in files in a local folder. */
export class LocalFolderFileDataCache<Data>{
    private _isCacheFolderInitialized = false;
    
    constructor(private _needs:{
        fileSystem: LocalFileSystem;
        cacheFolderPath: FolderPathBox;
    }){
    }
    
    private _maybeInitialize({
        onFileExistsInWayOfPath
    }:{
        onFileExistsInWayOfPath:OnException
    }){
        if(!this._isCacheFolderInitialized){
            this._needs.fileSystem.ensureFolderExistsSync({
                folderPathBox:this._needs.cacheFolderPath,
                onFileExistsInWayOfPath
            });
            this._isCacheFolderInitialized=true;
        }
    }
    async isCachedAsync(key: string){
        this._maybeInitialize({onFileExistsInWayOfPath:()=>{}});
        const path = this._makeFilePathFromKey(key);
        return this._needs.fileSystem.isExistingFilePathSync(path);
    }
    async getDataByKeyAsync(key: string){
        this._maybeInitialize({onFileExistsInWayOfPath:()=>{}});
        const filePathBox = this._makeFilePathFromKey(key);
        const dataString = this._needs.fileSystem.readStringSync({ filePathBox });
        const data = JSON.parse(''+dataString);
        return data as Data;
    }
    async maybeGetDataByKeyAsync(key: string){
        const isCached = await this.isCachedAsync(key);
        if(!isCached){
            return undefined;
        }
        return await this.getDataByKeyAsync(key);
    }
    async cacheDataAsync(data:Data,key: string){
        this._maybeInitialize({onFileExistsInWayOfPath:()=>{}});
        const cachedFilePath = this._makeFilePathFromKey(key);
        const dataString = JSON.stringify(data);
        this._needs.fileSystem.writeStringSync(dataString,cachedFilePath);
    }
    private _makeFilePathFromKey(key:string){
        const fileName = new FileNameBox(key);
        const path = this._needs.cacheFolderPath.makeChildFile(fileName);
        return path;
    }

}