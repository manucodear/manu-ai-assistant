using System.Text.RegularExpressions;

namespace Manu.AiAssistant.WebApi.Extensions
{
    public static class StringExtensions
    {
        public static string ExtractJson(this string responseContent)
        {
            var match = Regex.Match(responseContent, "```json\\s*(.*?)```", RegexOptions.Singleline);
            if (match.Success)
                responseContent = match.Groups[1].Value.Trim();
            else
            {
                match = Regex.Match(responseContent, "```\\s*(.*?)```", RegexOptions.Singleline);
                if (match.Success)
                    responseContent = match.Groups[1].Value.Trim();
            }
            var start = responseContent.IndexOf('{');
            var end = responseContent.LastIndexOf('}');
            if (start >= 0 && end > start)
                responseContent = responseContent.Substring(start, end - start + 1);

            return responseContent;
        }

        public static int CountWords(this string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return 0;

            // Split by whitespace and punctuation, count words
            var words = text
                .Split(new char[] { ' ', '\t', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries)
                .Length;

            return words;
        }
    }
}
