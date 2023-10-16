import { Box } from "away-away/Box";
import { Expect } from "away-away/Expect";
import { OnException } from "away-away/OnException";

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