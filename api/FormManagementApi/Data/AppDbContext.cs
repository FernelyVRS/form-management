using System;
using System.Collections.Generic;
using FormManagementApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormManagementApi.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Form> Forms { get; set; }

    public virtual DbSet<FormVersion> FormVersions { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Form>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Forms__3214EC0798BA8FB8");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(200);

            entity.HasOne(typeof(Form)).WithMany()
                .HasForeignKey(nameof(Form.SourceFormId))
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Forms_SourceForm");

            entity.HasOne(typeof(FormVersion)).WithMany()
                .HasForeignKey(nameof(Form.SourceVersionId))
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Forms_SourceVersion");
        });

        modelBuilder.Entity<FormVersion>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__FormVers__3214EC07B87C67E1");

            entity.HasIndex(e => new { e.FormId, e.VersionNumber }, "UX_FormVersions_FormId_VersionNumber").IsUnique();
            entity.HasIndex(e => e.FormId, "UX_FormVersions_Draft")
                .IsUnique()
                .HasFilter("[Status] = N'Draft'");
            entity.HasIndex(e => e.FormId, "UX_FormVersions_Published")
                .IsUnique()
                .HasFilter("[Status] = N'Published'");

            entity.ToTable(t => t.HasCheckConstraint(
                "CK_FormVersions_VersionNumberPositive", "[VersionNumber] > (0)"));

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.SchemaJson).HasColumnType("nvarchar(max)").IsRequired();
            entity.Property(e => e.RowVersion).IsRowVersion();

            entity.HasOne(d => d.DerivedFromVersion).WithMany(p => p.InverseDerivedFromVersion)
                .HasForeignKey(d => d.DerivedFromVersionId)
                .HasConstraintName("FK_FormVersions_DerivedFrom");

            entity.HasOne(d => d.Form).WithMany(p => p.FormVersions)
                .HasForeignKey(d => d.FormId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_FormVersions_Form");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
