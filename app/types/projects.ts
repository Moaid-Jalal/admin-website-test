export interface Project {
    id: string;
    title : string;
    images : {
        id : string;
        is_main : boolean;
        url : string;
    }[];
    description : string;
    short_description : string;
    creation_date : string;
    country : string;
    category_id : string;
    created_at : string;
}