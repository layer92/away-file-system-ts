import { Box } from "away-away/Box";

export class BytesBox extends Box<number>{

    toBits(){
        return this._data*8;
    }

    static FromBits(bits:number){
        return new BytesBox(bits/8);
    }
}