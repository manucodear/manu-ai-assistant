using System.Text.Json;

namespace Manu.AiAssistant.WebApi.Extensions;

public static class JsonExtensions
{
    /// <summary>
    /// Attempts to parse a JSON string into plain CLR objects (Dictionary / List / primitives) instead of JsonElement.
    /// Returns null for null/whitespace input. On failure returns an anonymous { error = original } object.
    /// </summary>
    public static object? ParseJsonToPlainObject(this string? content)
    {
        if (string.IsNullOrWhiteSpace(content)) return null;
        try
        {
            using var doc = JsonDocument.Parse(content);
            return ConvertElement(doc.RootElement);
        }
        catch
        {
            return new { error = content };
        }
    }

    private static object? ConvertElement(JsonElement element)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                var dict = new Dictionary<string, object?>();
                foreach (var prop in element.EnumerateObject())
                {
                    dict[prop.Name] = ConvertElement(prop.Value);
                }
                return dict;
            case JsonValueKind.Array:
                var list = new List<object?>();
                foreach (var item in element.EnumerateArray())
                {
                    list.Add(ConvertElement(item));
                }
                return list;
            case JsonValueKind.String:
                return element.GetString();
            case JsonValueKind.Number:
                if (element.TryGetInt64(out var l)) return l;
                if (element.TryGetDouble(out var d)) return d;
                return element.GetRawText();
            case JsonValueKind.True:
                return true;
            case JsonValueKind.False:
                return false;
            case JsonValueKind.Null:
            case JsonValueKind.Undefined:
                return null;
            default:
                return element.GetRawText();
        }
    }
}
