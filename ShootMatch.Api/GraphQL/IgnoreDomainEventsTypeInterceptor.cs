using HotChocolate.Configuration;
using HotChocolate.Types.Descriptors.Definitions;

namespace ShootMatch.Api.GraphQL;

/// <summary>
/// Prevents domain event internals from leaking into GraphQL schema generation.
/// </summary>
public sealed class IgnoreDomainEventsTypeInterceptor : TypeInterceptor
{
    public override void OnBeforeCompleteType(
        ITypeCompletionContext completionContext,
        DefinitionBase definition)
    {
        if (definition is not ObjectTypeDefinition objectDefinition)
            return;

        for (var i = objectDefinition.Fields.Count - 1; i >= 0; i--)
        {
            var field = objectDefinition.Fields[i];
            if (field.Name.Equals("domainEvents", StringComparison.OrdinalIgnoreCase))
                objectDefinition.Fields.RemoveAt(i);
        }
    }
}
