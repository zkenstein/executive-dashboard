<%@ WebHandler Language="C#" Class="proxy" %>
/*
 | Version 10.2
 | Copyright 2012 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
/*
  This proxy page does not have any security checks. It is highly recommended
  that a user deploying this proxy page on their web server, add appropriate
  security checks, for example checking request path, username/password, target
  url, etc.
*/
using System;
using System.Drawing;
using System.IO;
using System.Web;
using System.Collections.Generic;
using System.Text;
using System.Xml.Serialization;
using System.Web.Caching;

/// <summary>
/// Forwards requests to an ArcGIS Server REST resource. Uses information in
/// the proxy.config file to determine properties of the server.
/// </summary>
public class proxy : IHttpHandler
{

    public void ProcessRequest(HttpContext context)
    {

        HttpResponse response = context.Response;

        // Get the URL requested by the client (take the entire querystring at once
        //  to handle the case of the URL itself containing querystring parameters)
        string uri = context.Request.Url.Query.Substring(1);
        if (uri.Contains("https://api.twitter.com/1.1/search/tweets.json"))
        {
            char[] delimiters = new char[] { '?', '&' };
            string url = uri.Split(delimiters)[0];
            string query = uri.Split(delimiters)[1].Split(new char[] { '=' })[1];
            getTwitterData(url, query, response);
        }
        else
        {
            // Get token, if applicable, and append to the request
            string token = getTokenFromConfigFile(uri);
            if (!String.IsNullOrEmpty(token))
            {
                if (uri.Contains("?"))
                    uri += "&token=" + token;
                else
                    uri += "?token=" + token;
            }

            System.Net.HttpWebRequest req = (System.Net.HttpWebRequest)System.Net.HttpWebRequest.Create(uri);

            //code added to use default credentails for authenticating the request via proxy
            req.UseDefaultCredentials = true;
            req.Credentials = System.Net.CredentialCache.DefaultCredentials;

            req.Method = context.Request.HttpMethod;
            req.ServicePoint.Expect100Continue = false;

            // Set body of request for POST requests
            if (context.Request.InputStream.Length > 0)
            {
                byte[] bytes = new byte[context.Request.InputStream.Length];
                context.Request.InputStream.Read(bytes, 0, (int)context.Request.InputStream.Length);
                req.ContentLength = bytes.Length;

                string ctype = context.Request.ContentType;
                if (String.IsNullOrEmpty(ctype))
                {
                    req.ContentType = "application/x-www-form-urlencoded";
                }
                else
                {
                    req.ContentType = ctype;
                }

                using (Stream outputStream = req.GetRequestStream())
                {
                    outputStream.Write(bytes, 0, bytes.Length);
                }
            }

            // Send the request to the server
            System.Net.WebResponse serverResponse = null;
            try
            {
                serverResponse = req.GetResponse();
            }
            catch (System.Net.WebException webExc)
            {
                response.StatusCode = 500;
                response.StatusDescription = webExc.Status.ToString();
                response.Write(webExc.Response);
                response.End();
                return;
            }

            // Set up the response to the client
            if (serverResponse != null)
            {
                response.ContentType = serverResponse.ContentType;
                using (Stream byteStream = serverResponse.GetResponseStream())
                {

                    // Text response
                    if (serverResponse.ContentType.Contains("text") ||
                        serverResponse.ContentType.Contains("json"))
                    {
                        using (StreamReader sr = new StreamReader(byteStream))
                        {
                            string strResponse = sr.ReadToEnd();
                            response.Write(strResponse);
                        }
                    }
                    else
                    {
                        // Binary response (image, lyr file, other binary file)
                        BinaryReader br = new BinaryReader(byteStream);
                        byte[] outb = br.ReadBytes((int)serverResponse.ContentLength);
                        br.Close();

                        // Tell client not to cache the image since it's dynamic
                        response.CacheControl = "no-cache";

                        // Send the image to the client
                        // (Note: if large images/files sent, could modify this to send in chunks)
                        response.OutputStream.Write(outb, 0, outb.Length);
                    }

                    serverResponse.Close();
                }
            }
            response.End();
        }
    }

    public bool IsReusable
    {
        get
        {
            return false;
        }
    }

    static void getTwitterData(string URL, string query, HttpResponse response)
    {

        // oauth application keys
        var oauth_token = "986048725-MtrzgCk1Usd6DsasYELV5CMcZFWuJb7vLdcNFkJo"; //"insert here...";
        var oauth_token_secret = "87ThaFXJDVqhyfjBHfFs5qM4BroOKKv4h3mGfNf8"; //"insert here...";
        var oauth_consumer_key = "17pVbOgTTPCTpPMTt8ptiw";// = "insert here...";
        var oauth_consumer_secret = "AgpnDNZ2giURm7A9J9xQSS57Vnhkarpm6d9txwLs";// = "insert here...";

        // oauth implementation details
        var oauth_version = "1.0";
        var oauth_signature_method = "HMAC-SHA1";

        // unique request details
        var oauth_nonce = Convert.ToBase64String(
            new ASCIIEncoding().GetBytes(DateTime.Now.Ticks.ToString()));
        var timeSpan = DateTime.UtcNow
            - new DateTime(1970, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc);
        var oauth_timestamp = Convert.ToInt64(timeSpan.TotalSeconds).ToString();

        // create oauth signature
        var baseFormat = "oauth_consumer_key={0}&oauth_nonce={1}&oauth_signature_method={2}" +
                        "&oauth_timestamp={3}&oauth_token={4}&oauth_version={5}&q={6}";

        var baseString = string.Format(baseFormat,
                                    oauth_consumer_key,
                                    oauth_nonce,
                                    oauth_signature_method,
                                    oauth_timestamp,
                                    oauth_token,
                                    oauth_version,
                                    Uri.EscapeDataString(query)
                                    );

        baseString = string.Concat("GET&", Uri.EscapeDataString(URL), "&", Uri.EscapeDataString(baseString));

        var compositeKey = string.Concat(Uri.EscapeDataString(oauth_consumer_secret),
                                "&", Uri.EscapeDataString(oauth_token_secret));

        string oauth_signature;
        using (System.Security.Cryptography.HMACSHA1 hasher = new System.Security.Cryptography.HMACSHA1(ASCIIEncoding.ASCII.GetBytes(compositeKey)))
        {
            oauth_signature = Convert.ToBase64String(
                hasher.ComputeHash(ASCIIEncoding.ASCII.GetBytes(baseString)));
        }

        // create the request header
        var headerFormat = "OAuth oauth_nonce=\"{0}\", oauth_signature_method=\"{1}\", " +
                           "oauth_timestamp=\"{2}\", oauth_consumer_key=\"{3}\", " +
                           "oauth_token=\"{4}\", oauth_signature=\"{5}\", " +
                           "oauth_version=\"{6}\"";

        var authHeader = string.Format(headerFormat,
                                Uri.EscapeDataString(oauth_nonce),
                                Uri.EscapeDataString(oauth_signature_method),
                                Uri.EscapeDataString(oauth_timestamp),
                                Uri.EscapeDataString(oauth_consumer_key),
                                Uri.EscapeDataString(oauth_token),
                                Uri.EscapeDataString(oauth_signature),
                                Uri.EscapeDataString(oauth_version)
                        );
        //return;
        System.Net.ServicePointManager.Expect100Continue = false;

        // make the request
        URL = URL + "?q=" + Uri.EscapeDataString(query);//

        System.Net.HttpWebRequest request = (System.Net.HttpWebRequest)System.Net.WebRequest.Create(URL);
        request.Headers.Add("Authorization", authHeader);
        request.Method = "GET";
        request.ContentType = "application/x-www-form-urlencoded";

        System.Net.WebResponse serverResponse = request.GetResponse();
        var reader = new StreamReader(serverResponse.GetResponseStream());
        var objText = reader.ReadToEnd();
        response.Write(objText);
        serverResponse.Close();
        response.End();
    }
    
    // Gets the token for a server URL from a configuration file
    // TODO: ?modify so can generate a new short-lived token from username/password in the config file
    private string getTokenFromConfigFile(string uri)
    {
        try
        {
            ProxyConfig config = ProxyConfig.GetCurrentConfig();
            if (config != null)
                return config.GetToken(uri);
            else
                throw new ApplicationException(
                    "Proxy.config file does not exist at application root, or is not readable.");
        }
        catch (InvalidOperationException)
        {
            // Proxy is being used for an unsupported service (proxy.config has mustMatch="true")
            HttpResponse response = HttpContext.Current.Response;
            response.StatusCode = (int)System.Net.HttpStatusCode.Forbidden;
            response.End();
        }
        catch (Exception e)
        {
            if (e is ApplicationException)
                throw e;

            // just return an empty string at this point
            // -- may want to throw an exception, or add to a log file
        }

        return string.Empty;
    }
}

[XmlRoot("ProxyConfig")]
public class ProxyConfig
{
    #region Static Members

    private static object _lockobject = new object();

    public static ProxyConfig LoadProxyConfig(string fileName)
    {
        ProxyConfig config = null;

        lock (_lockobject)
        {
            if (System.IO.File.Exists(fileName))
            {
                XmlSerializer reader = new XmlSerializer(typeof(ProxyConfig));
                using (System.IO.StreamReader file = new System.IO.StreamReader(fileName))
                {
                    config = (ProxyConfig)reader.Deserialize(file);
                }
            }
        }

        return config;
    }

    public static ProxyConfig GetCurrentConfig()
    {
        ProxyConfig config = HttpRuntime.Cache["proxyConfig"] as ProxyConfig;
        if (config == null)
        {
            string fileName = GetFilename(HttpContext.Current);
            config = LoadProxyConfig(fileName);

            if (config != null)
            {
                CacheDependency dep = new CacheDependency(fileName);
                HttpRuntime.Cache.Insert("proxyConfig", config, dep);
            }
        }

        return config;
    }

    public static string GetFilename(HttpContext context)
    {
        return context.Server.MapPath("~/proxy.config");
    }
    #endregion

    ServerUrl[] serverUrls;
    bool mustMatch;

    [XmlArray("serverUrls")]
    [XmlArrayItem("serverUrl")]
    public ServerUrl[] ServerUrls
    {
        get { return this.serverUrls; }
        set { this.serverUrls = value; }
    }

    [XmlAttribute("mustMatch")]
    public bool MustMatch
    {
        get { return mustMatch; }
        set { mustMatch = value; }
    }

    public string GetToken(string uri)
    {
        foreach (ServerUrl su in serverUrls)
        {
            if (su.MatchAll && uri.StartsWith(su.Url, StringComparison.InvariantCultureIgnoreCase))
            {
                return su.Token;
            }
            else
            {
                if (String.Compare(uri, su.Url, StringComparison.InvariantCultureIgnoreCase) == 0)
                    return su.Token;
            }
        }

        if (mustMatch)
            throw new InvalidOperationException();

        return string.Empty;
    }
}

public class ServerUrl
{
    string url;
    bool matchAll;
    string token;

    [XmlAttribute("url")]
    public string Url
    {
        get { return url; }
        set { url = value; }
    }

    [XmlAttribute("matchAll")]
    public bool MatchAll
    {
        get { return matchAll; }
        set { matchAll = value; }
    }

    [XmlAttribute("token")]
    public string Token
    {
        get { return token; }
        set { token = value; }
    }
}
