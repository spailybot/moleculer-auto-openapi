export interface MoleculerWebMetas<P extends Record<string, any> = Record<string, any>> {
    $statusCode?: number;
    $statusMessage?: string;
    $responseType?: string;
    $responseHeaders?: string;
    $location?: string;

    //when file upload
    $multipart?: {};
    fieldname?: string;
    filename?: string;
    encoding?: string;
    mimetype?: string;
    $params?: P;
}
