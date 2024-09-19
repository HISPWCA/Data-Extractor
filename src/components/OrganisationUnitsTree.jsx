import { useState, useEffect } from "react";
import { CarryOutOutlined } from "@ant-design/icons";
import { TreeSelect } from "antd";

const generateTreeFromOrgUnits = (
  ouList = [],
  icon = null,
  parentId = null,
  level = 1,
  setLoading
) => {
  setLoading && setLoading(true);
  let orgUnits = ouList.map((o) => {
    return {
      key: o.id,
      id: o.id,
      label: o.displayName,
      title: o.displayName,
      data: o,
      level: o.level,
      value: o.id,
      icon: icon,
      children: [],
      parent: o.parent !== null && o.parent !== undefined ? o.parent.id : null,
    };
  });

  let nodes = parentId
    ? orgUnits.filter((o) => o.id === parentId)
    : orgUnits.filter((o) => o.level === level);

  nodes.forEach((o) => {
    o.children = orgUnits.filter((org) => org.parent === o.id);

    o.children.forEach((a) => {
      a.children = orgUnits.filter((org) => org.parent === a.id);

      a.children.forEach((b) => {
        b.children = orgUnits.filter((org) => org.parent === b.id);

        b.children.forEach((c) => {
          c.children = orgUnits.filter((org) => org.parent === c.id);

          c.children.forEach((d) => {
            d.children = orgUnits.filter((org) => org.parent === d.id);

            d.children.forEach((e) => {
              e.children = orgUnits.filter((org) => org.parent === e.id);

              e.children.forEach((f) => {
                f.children = orgUnits.filter((org) => org.parent === f.id);

                f.children.forEach((g) => {
                  g.children = orgUnits.filter((org) => org.parent === g.id);

                  g.children.forEach((h) => {
                    h.children = orgUnits.filter((org) => org.parent === h.id);

                    h.children.forEach((i) => {
                      i.children = orgUnits.filter(
                        (org) => org.parent === i.id
                      );

                      i.children.forEach((j) => {
                        j.children = orgUnits.filter(
                          (org) => org.parent === j.id
                        );

                        j.children.forEach((k) => {
                          k.children = orgUnits.filter(
                            (org) => org.parent === k.id
                          );

                          k.children.forEach((l) => {
                            l.children = orgUnits.filter(
                              (org) => org.parent === l.id
                            );

                            l.children.forEach((m) => {
                              m.children = orgUnits.filter(
                                (org) => org.parent === m.id
                              );

                              m.children.forEach((n) => {
                                n.children = orgUnits.filter(
                                  (org) => org.parent === n.id
                                );

                                n.children.forEach((p) => {
                                  p.children = orgUnits.filter(
                                    (org) => org.parent === p.id
                                  );

                                  p.children.forEach((q) => {
                                    q.children = orgUnits.filter(
                                      (org) => org.parent === q.id
                                    );

                                    q.children.forEach((r) => {
                                      r.children = orgUnits.filter(
                                        (org) => org.parent === r.id
                                      );

                                      r.children.forEach((s) => {
                                        s.children = orgUnits.filter(
                                          (org) => org.parent === s.id
                                        );

                                        s.children.forEach((t) => {
                                          t.children = orgUnits.filter(
                                            (org) => org.parent === t.id
                                          );

                                          t.children.forEach((u) => {
                                            u.children = orgUnits.filter(
                                              (org) => org.parent === u.id
                                            );

                                            u.children.forEach((v) => {
                                              v.children = orgUnits.filter(
                                                (org) => org.parent === v.id
                                              );

                                              v.children.forEach((w) => {
                                                w.children = orgUnits.filter(
                                                  (org) => org.parent === w.id
                                                );

                                                w.children.forEach((x) => {
                                                  x.children = orgUnits.filter(
                                                    (org) => org.parent === x.id
                                                  );

                                                  x.children.forEach((y) => {
                                                    y.children =
                                                      orgUnits.filter(
                                                        (org) =>
                                                          org.parent === y.id
                                                      );

                                                    y.children.forEach((z) => {
                                                      z.children =
                                                        orgUnits.filter(
                                                          (org) =>
                                                            org.parent === z.id
                                                        );
                                                    });
                                                  });
                                                });
                                              });
                                            });
                                          });
                                        });
                                      });
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  setLoading && setLoading(false);

  return nodes;
};

const getParentKey = (key, tree = []) => {
  let parentKey;
  for (let i = 0; i < tree.length; i++) {
    const node = tree[i];
    if (node.children) {
      if (node.children.some((item) => item.key === key)) {
        parentKey = node.key;
      } else if (getParentKey(key, node.children)) {
        parentKey = getParentKey(key, node.children);
      }
    }
  }
  return parentKey;
};

const OrganisationUnitsTree = ({
  setCurrentOrgUnits,
  currentOrgUnits,
  orgUnits,
  meOrgUnitId,
  loadingOrganisationUnits,
  setLoadingOrganisationUnits,
  multiple = false,
  onChange,
}) => {
  const [tree, setTree] = useState([]);
  useEffect(() => {
    if (orgUnits.length > 0) {
      setLoadingOrganisationUnits && setLoadingOrganisationUnits(true);
      setTimeout(() => {
        setTree(
          generateTreeFromOrgUnits(orgUnits, <CarryOutOutlined />, meOrgUnitId)
        );
        setLoadingOrganisationUnits && setLoadingOrganisationUnits(false);
      }, 100);
    }
  }, [orgUnits]);
  return (
    <div>
      <TreeSelect
        loading={loadingOrganisationUnits}
        disabled={loadingOrganisationUnits}
        showSearch
        style={{ width: "100%" }}
        dropdownStyle={{
          maxHeight: 400,
        }}
        treeLine
        filterTreeNode={(search, item) => {
          return item.title.toLowerCase().includes(search.toLowerCase());
        }}
        placeholder={
          multiple ? "Select organisation units" : "Select organisation unit"
        }
        allowClear
        multiple={multiple}
        value={
          multiple ? currentOrgUnits?.map((cur) => cur.id) : currentOrgUnits?.id
        }
        onChange={(values) => {
          const currentValue = multiple
            ? values.map((v) => orgUnits.find((ou) => ou.id === v))
            : orgUnits.find((ou) => ou.id === values);
          setCurrentOrgUnits(currentValue);
          onChange && onChange(currentValue);
        }}
        treeData={tree}
      />
    </div>
  );
};

export default OrganisationUnitsTree;
