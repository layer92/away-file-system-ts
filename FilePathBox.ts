import { Box } from "away-core/Box";
import { Expect } from "away-core/Expect";
import { OnException } from "away-core/OnException";
import { FileFormatBox } from "./FileFormatBox";
import { FileNameBox } from "./FileNameBox";
import { FolderPathBox } from "./FolderPathBox";

export class FilePathBox extends Box<string>{
    private FilePathBox:undefined;
    constructor(
        value:any,
        onValidationFail:OnException,
    ){
        value = ''+value;
        Expect(!value.endsWith("/"),`value: ends with "/"`,onValidationFail);
        super(value);
    }
    getExtensionBox(){
        return this.getFormatBox()?.toExtensionBox();
    }
    getFormatBox(){
        const [lastNode] = this._data.split("/").slice(-1);
        const formatString = lastNode.split(".").slice(-1)[0] as string|undefined;
        if( formatString===undefined ){
            return undefined;
        }
        return new FileFormatBox(formatString);
    }
    getFileNameBox(){
        const lastNode = this._data.split("/").slice(-1)[0];
        return new FileNameBox(lastNode);
    }
    getParentPathBox(){
        const fileName = this.getFileNameBox();
        const parentPath = this._data.slice(0,-fileName.getData().length);
        return new FolderPathBox(parentPath,()=>{});
    }
    /** Returns a filepath with the filename renamed  */
    rename(toName:FileNameBox){
        const toFolder = this.getParentPathBox();
        return new FilePathBox(toFolder.getData()+toName.getData(),()=>{});
    }
    /** Returns a filepath of the file moved into the folder */
    moveIntoFolder(toFolderPath:FolderPathBox){
        const fileName = this.getFileNameBox();
        return new FilePathBox(toFolderPath.getData()+fileName.getData(),()=>{});
    }
    append(string:string,onInvalidData:OnException){
        return new FilePathBox(
            this.getData()+string,
            onInvalidData
        );
    }
}