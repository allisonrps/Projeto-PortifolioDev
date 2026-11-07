using System.Text.RegularExpressions;

namespace Aura.Infrastructure.Security;

public static partial class HtmlSanitizerHelper
{
    // Remove tags perigosas e seu conteúdo (<script>, <iframe>, <object>, <embed>, <applet>, <form>, <base>, <meta>)
    private static readonly Regex DangerousBlockTagsRegex = new(
        @"<\s*(script|iframe|object|embed|applet|form|meta|base|link)\b[^>]*>([\s\S]*?)<\s*/\s*\1\s*>",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex DangerousSelfClosingTagsRegex = new(
        @"<\s*/?\s*(script|iframe|object|embed|applet|form|meta|base|link)\b[^>]*>",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // Remove atributos de eventos inline (onerror=, onclick=, onload=, onmouseover=, onfocus=, etc.)
    private static readonly Regex InlineEventHandlersRegex = new(
        @"\s+on[a-z0-9_]+\s*=\s*(?:""[^""]*""|'[^']*'|[^\s>]+)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // Remove protocolos javascript:, vbscript: e data:text/html em href, src, action, xlink:href
    private static readonly Regex DangerousProtocolsRegex = new(
        @"(href|src|action|formaction|xlink:href)\s*=\s*([""']?)\s*(?:javascript|vbscript|data\s*:\s*text/html)\s*:[^""'>\s]*\2",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public static string Sanitize(string? html)
    {
        if (string.IsNullOrWhiteSpace(html))
            return string.Empty;

        var cleaned = DangerousBlockTagsRegex.Replace(html, string.Empty);
        cleaned = DangerousSelfClosingTagsRegex.Replace(cleaned, string.Empty);
        cleaned = InlineEventHandlersRegex.Replace(cleaned, string.Empty);
        cleaned = DangerousProtocolsRegex.Replace(cleaned, "$1=\"#\"");

        return cleaned;
    }
}
