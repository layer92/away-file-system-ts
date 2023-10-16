import { Box } from "away-away/Box";
import { FileExtensionBox } from "./FileExtensionBox";
import { FileFormatBox } from "./FileFormatBox";

/** includes the extension */
export class FileNameBox extends Box<String>{

    getExtensionBox(){
        const format = this.getFormatBox();
        if(!format){
            return undefined;
        }
        return FileExtensionBox.MakeFromFormat(format);
    }
    getFormatBox(){
        const formatString = this._data.split(".").slice(-1)[0] as string|undefined;
        if( formatString===undefined ){
            return undefined;
        }
        return new FileFormatBox(formatString);
    }
    getBaseName(){
        const extensionString = this.getExtensionBox()?.getData()||"";
        const data = this._data.slice(0,-extensionString.length);
        return data;
    }
}