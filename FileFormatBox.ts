import { Box } from "away-core/Box";
import { FileExtensionBox } from "./FileExtensionBox";

/** values such as: "mp3", "jpg", "tar.gz" etc... */
export class FileFormatBox extends Box<string>{

    toExtensionBox(){
        return new FileExtensionBox("."+this._data,()=>{});
    }

    static FromExtensionBox(extension:FileExtensionBox){
        return new FileFormatBox( extension.getData().slice(1) );
    }
}