using System;
using System.Collections.Generic;

namespace FormManagementApi.Entities;

public partial class Form
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<FormVersion> FormVersions { get; set; } = new List<FormVersion>();
}
