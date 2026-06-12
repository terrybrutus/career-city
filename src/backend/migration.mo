module {
  type Header = { name : Text; value : Text };
  type HttpResponse = { status : Nat; headers : [Header]; body : Blob };
  type HttpRequest = {
    url : Text;
    max_response_bytes : ?Nat64;
    method : { #get; #head; #post };
    headers : [Header];
    body : ?Blob;
    transform : ?{
      function : shared query ({
        response : HttpResponse;
        context : Blob;
      }) -> async HttpResponse;
      context : Blob;
    };
    is_replicated : ?Bool;
  };

  public func migration(old : {
    GROQ_API_KEY : Text;
    HTTP_CYCLES : Nat;
    aiApiUrl : Text;
    aiModel : Text;
    ic : actor { http_request : shared HttpRequest -> async HttpResponse };
  }) : {} {
    ignore old;
    {};
  };
};
