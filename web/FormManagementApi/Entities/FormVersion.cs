using System;
using System.Collections.Generic;

namespace FormManagementApi.Entities;

public partial class FormVersion
{
    public Guid Id { get; set; }

    public Guid FormId { get; set; }

    public int VersionNumber { get; set; }

    public string Status { get; set; } = null!;

    public string SchemaJson { get; set; } = null!;

    public Guid? DerivedFromVersionId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual FormVersion? DerivedFromVersion { get; set; }

    public virtual Form Form { get; set; } = null!;

    public virtual ICollection<FormVersion> InverseDerivedFromVersion { get; set; } = new List<FormVersion>();
}
