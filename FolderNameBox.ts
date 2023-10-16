import { Box } from "away-core/Box";
import { Expect } from "away-core/Expect";
import { OnException } from "away-core/OnException";

export class FolderNameBox extends Box<String>{
    private FolderNameBox:undefined;

    constructor(
        data:string,
        onValidationFail:OnException,
    ){
        Expect(data.length,"data: cannot be empty.",onValidationFail);
        Expect(!data.includes("/"),"data: cannot have a slash in it.",onValidationFail);
        super(data);
    }
}